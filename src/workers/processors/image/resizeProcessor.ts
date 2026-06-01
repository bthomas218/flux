import type {
  ImageResizePayload,
  ImageResultPayLoad,
} from "../../../types/imageJobTypes.js";
import { prisma } from "../../../lib/prisma.js";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { generateToken } from "../../../lib/crypto.js";
import { webhookQueue } from "../../../queues/webhookQueue.js";
import type { WebhookJobPayload } from "../../../types/webhookJobTypes.js";

// TODO: Implement the logic for image resize job
const resizeProcessor = async (
  data: ImageResizePayload,
  jobId: string,
): Promise<ImageResultPayLoad> => {
  await updateJobStatus(jobId, "IN_PROGRESS");

  const file = await prisma.file.findUnique({
    where: {
      id: data.fileId,
    },
  });

  if (!file) {
    await updateJobStatus(jobId, "FAILED");
    await sendWebhookNotification(
      jobId,
      "FAILED",
      data.fileId,
      undefined,
      "File not found",
    );
    throw new Error("File not found");
  }

  try {
    await fs.promises.access(file.url, fs.constants.F_OK);
  } catch (err) {
    await updateJobStatus(jobId, "FAILED");
    await sendWebhookNotification(
      jobId,
      "FAILED",
      data.fileId,
      undefined,
      "File not found on disk",
    );
    throw new Error("File not found on disk");
  }

  try {
    const outputDir = path.join("outputs", file.userId, jobId);
    await fs.promises.mkdir(outputDir, { recursive: true });

    const { info, outputPath } = await resizeImage(
      file.url,
      outputDir,
      file.filename,
      file.filename.split(".").pop() || "jpg",
      data.options.width,
      data.options.height,
      data.options.fit,
    );

    console.log("Image resized successfully");
    const newFile = await prisma.file.create({
      data: {
        userId: file.userId,
        filename: `${file.filename}-resized`,
        storageKey: generateToken(), // Placeholder for storage key if using external storage
        mimeType: file.mimeType,
        url: outputPath,
        size: info.size,
      },
    });

    await updateJobStatus(jobId, "COMPLETED", newFile.id);

    console.log(`Resize job completed for fileId: ${data.fileId}`);

    await sendWebhookNotification(jobId, "COMPLETED", data.fileId, newFile.id);

    return {
      type: "image.resize",
      output: {
        fileId: newFile.id,
        storageKey: newFile.storageKey,
        mimeType: newFile.mimeType,
        width: data.options.width || info.width || 0,
        height: data.options.height || info.height || 0,
      },
    };
  } catch (err) {
    await updateJobStatus(jobId, "FAILED");
    await sendWebhookNotification(
      jobId,
      "FAILED",
      data.fileId,
      undefined,
      (err as Error).message,
    );
    throw new Error(`Error processing image resize job: ${err}`);
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

async function resizeImage(
  inputPath: string,
  outputDir: string,
  fileName: string,
  extension: string,
  width?: number,
  height?: number,
  fit?: "cover" | "contain" | "fill" | "inside" | "outside",
) {
  const image = sharp(inputPath).resize({
    width,
    height,
    fit,
  });
  let info;
  const outputPath = path.join(outputDir, `${fileName}-resized.${extension}`);
  switch (extension.toLowerCase()) {
    case "jpg":
    case "jpeg":
      info = await image.jpeg().toFile(outputPath);
      break;
    case "png":
      info = await image.png().toFile(outputPath);
      break;
    case "webp":
      info = await image.webp().toFile(outputPath);
      break;
    case "avif":
      info = await image.avif().toFile(outputPath);
      break;
    default:
      throw new Error("Unsupported file extension");
  }

  return { info, outputPath };
}

async function sendWebhookNotification(
  jobId: string,
  status: "COMPLETED" | "FAILED",
  inputFileId: string,
  outputFileId?: string,
  errorMessage?: string,
) {
  const payload =
    status === "COMPLETED"
      ? {
          event: "job.completed",
          type: "image.resize",
          jobId,
          status,
          result: {
            inputFileId,
            outputFileId: outputFileId!,
          },
        }
      : {
          event: "job.failed",
          type: "image.resize",
          jobId,
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

export { resizeProcessor, sendWebhookNotification };

export default resizeProcessor;
