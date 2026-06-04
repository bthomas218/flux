import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { generateToken } from "../../../../lib/crypto.js";
import { prisma } from "../../../../lib/prisma.js";
import type {
  ImageResultPayLoad,
  ImageTranscodePayload,
} from "../../../../modules/jobs/types.js";
import { updateJobStatus } from "../../jobsService.js";
import {
  resolveStoragePath,
  ensureFileExists,
} from "../../../files/filesService.js";

const mimeTypes: Record<ImageTranscodePayload["options"]["format"], string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

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

  await ensureFileExists(inputPath);

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
