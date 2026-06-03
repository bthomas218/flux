import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { generateToken } from "../../../lib/crypto.js";
import { prisma } from "../../../lib/prisma.js";
import type {
  ImageResultPayLoad,
  ImageTranscodePayload,
} from "../../../types/imageJobTypes.js";
import { sendWebhookNotification, updateJobStatus } from "../../jobUtils.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

const mimeTypes: Record<ImageTranscodePayload["options"]["format"], string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

function resolveStoragePath(storedPath: string) {
  return path.isAbsolute(storedPath)
    ? storedPath
    : path.resolve(projectRoot, storedPath);
}

const transcodeProcessor = async (
  data: ImageTranscodePayload,
  jobId: string,
): Promise<ImageResultPayLoad> => {
  await updateJobStatus(jobId, "IN_PROGRESS");

  const file = await prisma.file.findUnique({
    where: {
      id: data.fileId,
    },
  });

  if (!file) {
    throw new Error("File not found");
  }

  const inputPath = resolveStoragePath(file.url);

  try {
    await fs.promises.access(inputPath, fs.constants.F_OK);
  } catch (err) {
    console.log(`File not found on disk at path: ${inputPath}`);
    throw new Error("File not found on disk");
  }

  try {
    const outputDir = path.join("outputs", file.userId, jobId);
    const outputDirPath = resolveStoragePath(outputDir);
    await fs.promises.mkdir(outputDirPath, { recursive: true });

    const { info, outputPath } = await transcodeImage(
      inputPath,
      outputDirPath,
      file.filename,
      data.options.format,
      data.options.quality,
    );
    const outputUrl = path.join(outputDir, path.basename(outputPath));

    const newFile = await prisma.file.create({
      data: {
        userId: file.userId,
        filename: path.basename(outputPath),
        storageKey: generateToken(),
        mimeType: mimeTypes[data.options.format],
        url: outputUrl,
        size: info.size,
      },
    });

    await updateJobStatus(jobId, "COMPLETED", newFile.id);
    await sendWebhookNotification(
      jobId,
      data.userId,
      "COMPLETED",
      data.fileId,
      data.webHookEndpointId,
      "image.transcode",
      newFile.id,
      undefined,
    );

    return {
      type: "image.transcode",
      output: {
        fileId: newFile.id,
        storageKey: newFile.storageKey,
        mimeType: newFile.mimeType,
        width: info.width,
        height: info.height,
      },
    };
  } catch (err) {
    const message = (err as Error).message;
    throw new Error(`Error processing image transcode job: ${message}`);
  }
};

async function transcodeImage(
  inputPath: string,
  outputDir: string,
  fileName: string,
  format: ImageTranscodePayload["options"]["format"],
  quality?: number,
) {
  const parsedName = path.parse(fileName).name;
  const outputPath = path.join(outputDir, `${parsedName}-transcoded.${format}`);
  const image = sharp(inputPath);

  switch (format) {
    case "jpeg":
      return {
        info: await image.jpeg({ quality }).toFile(outputPath),
        outputPath,
      };
    case "png":
      return {
        info: await image.png({ quality }).toFile(outputPath),
        outputPath,
      };
    case "webp":
      return {
        info: await image.webp({ quality }).toFile(outputPath),
        outputPath,
      };
    case "avif":
      return {
        info: await image.avif({ quality }).toFile(outputPath),
        outputPath,
      };
  }
}

export { transcodeProcessor };

export default transcodeProcessor;
