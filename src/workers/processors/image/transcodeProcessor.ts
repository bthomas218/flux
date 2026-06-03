import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { generateToken } from "../../../lib/crypto.js";
import { prisma } from "../../../lib/prisma.js";
import { webhookQueue } from "../../../queues/webhookQueue.js";
import type {
  ImageResultPayLoad,
  ImageTranscodePayload,
} from "../../../types/imageJobTypes.js";
import type { WebhookJobPayload } from "../../../types/webhookJobTypes.js";

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
    await failJob(
      jobId,
      data.userId,
      data.fileId,
      data.webHookEndpointId,
      "File not found",
    );
    throw new Error("File not found");
  }

  const inputPath = resolveStoragePath(file.url);

  try {
    await fs.promises.access(inputPath, fs.constants.F_OK);
  } catch (err) {
    console.log(`File not found on disk at path: ${inputPath}`);
    await failJob(
      jobId,
      data.userId,
      data.fileId,
      data.webHookEndpointId,
      "File not found on disk",
    );
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
      newFile.id,
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
    await failJob(
      jobId,
      data.userId,
      data.fileId,
      data.webHookEndpointId,
      message,
    );
    throw new Error(`Error processing image transcode job: ${message}`);
  }
};

async function updateJobStatus(
  jobId: string,
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED",
  newFileId?: string,
) {
  const now = new Date();

  const data: {
    status: typeof status;
    outputFileId?: string;
    startedAt?: Date;
    finishedAt?: Date;
  } = {
    status,
  };

  if (status === "IN_PROGRESS") {
    data.startedAt = now;
  } else if (status === "COMPLETED") {
    data.finishedAt = now;
    data.outputFileId = newFileId;
  } else if (status === "FAILED") {
    data.finishedAt = now;
  }

  await prisma.job.update({
    where: {
      id: jobId,
    },
    data,
  });
}

async function failJob(
  jobId: string,
  userId: string,
  inputFileId: string,
  webhookEndpointId: string,
  errorMessage: string,
) {
  await updateJobStatus(jobId, "FAILED");
  await sendWebhookNotification(
    jobId,
    userId,
    "FAILED",
    inputFileId,
    webhookEndpointId,
    undefined,
    errorMessage,
  );
}

async function transcodeImage(
  inputPath: string,
  outputDir: string,
  fileName: string,
  format: ImageTranscodePayload["options"]["format"],
  quality?: number,
) {
  const parsedName = path.parse(fileName).name;
  const outputPath = path.join(
    outputDir,
    `${parsedName}-transcoded.${format}`,
  );
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

async function sendWebhookNotification(
  jobId: string,
  userId: string,
  status: "COMPLETED" | "FAILED",
  inputFileId: string,
  webhookEndpointId: string,
  outputFileId?: string,
  errorMessage?: string,
) {
  const payload =
    status === "COMPLETED"
      ? {
          event: "job.completed",
          type: "image.transcode",
          jobId,
          userId,
          webHookEndpointId: webhookEndpointId,
          status,
          result: {
            inputFileId,
            outputFileId: outputFileId!,
          },
        }
      : {
          event: "job.failed",
          type: "image.transcode",
          jobId,
          userId,
          webHookEndpointId: webhookEndpointId,
          status,
          error: {
            message: errorMessage || "Unknown error",
          },
        };

  await webhookQueue.add(
    status === "COMPLETED" ? "job.completed" : "job.failed",
    payload as WebhookJobPayload,
  );
}

export { transcodeProcessor };

export default transcodeProcessor;
