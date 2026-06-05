import { Worker } from "bullmq";
import path from "node:path";
import sharp from "sharp";
import { cfg } from "../../config/cfg.js";

import type {
  ImageJobNames,
  ImageJobPayload,
  ImageResultPayLoad,
  ImageTranscodePayload,
} from "./types.js";
import { processorRegistry } from "./processors/processor.js";
import type { Processor } from "./processors/processor.js";
import { createWebhookService } from "../webhooks/webhook.service.js";
import { createWebhookQueue } from "../webhooks/webhook.queue.js";
import { createPrismaClient } from "../../lib/prisma.js";
import { createJobService } from "./job.service.js";
import { createRedis } from "../../lib/redis.js";
import { createFileMetadataService } from "../files/file-metadata.service.js";
import { FileStorageService } from "../files/file-storage.service.js";
import { createJobQueue } from "./job.queue.js";
import { generateToken } from "../../lib/crypto.js";

const connection = createRedis(cfg.REDIS_URL);
const prisma = createPrismaClient(cfg.DATABASE_URL);

const webhookQueue = createWebhookQueue(connection);
const webhookService = createWebhookService(prisma, webhookQueue, cfg);
const fileMetadataService = createFileMetadataService(prisma);
const fileStorageService = new FileStorageService();
const jobQueue = createJobQueue(connection);
const jobService = createJobService(
  prisma,
  fileMetadataService,
  fileStorageService,
  jobQueue,
);

const mediaWorker = new Worker<
  ImageJobPayload,
  ImageResultPayLoad,
  ImageJobNames
>(
  "media",
  async (job) => {
    if (!job.id) {
      throw new Error("Job ID is required");
    }

    await jobService.updateStatus(job.id, "IN_PROGRESS");

    const processor: Processor = processorRegistry[job.data.type];
    const sourceFile = await fileMetadataService.findOne(
      job.data.fileId,
      job.data.userId,
    );
    const sourceStream = await fileStorageService.read(sourceFile.url);
    const processed = await processor(sourceStream, job.data.options);

    if (job.data.type === "image.alttext") {
      if (isReadableStream(processed)) {
        throw new Error("Expected image.alttext processor to return text");
      }

      const result: ImageResultPayLoad = {
        type: "image.alttext",
        output: {
          altText: processed,
        },
      };

      await jobService.updateStatus(job.id, "COMPLETED");
      return result;
    }

    if (!isReadableStream(processed)) {
      throw new Error(`Expected ${job.data.type} processor to return a stream`);
    }

    const outputMimeType = getOutputMimeType(job.data, sourceFile.mimeType);
    const outputFilename = getOutputFilename(
      sourceFile.filename,
      job.data.type,
      outputMimeType,
    );
    const outputUrl = path.join(
      "outputs",
      `${job.data.userId}`,
      `-${Date.now()}-${outputFilename}`,
    );
    const outputSize = await fileStorageService.write(outputUrl, processed);
    const outputFile = await fileMetadataService.create({
      userId: job.data.userId,
      filename: outputFilename,
      mimeType: outputMimeType,
      url: outputUrl,
      storageKey: generateToken(),
      size: outputSize,
    });
    const outputStream = await fileStorageService.read(outputUrl);
    const metadata = await readImageMetadata(outputStream);

    await jobService.updateStatus(job.id, "COMPLETED", outputFile.id);

    return {
      type: job.data.type,
      output: {
        fileId: outputFile.id,
        storageKey: outputFile.storageKey,
        mimeType: outputFile.mimeType,
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
      },
    };
  },
  { connection },
);
mediaWorker.on("failed", async (job, err) => {
  if (!job?.id) {
    return;
  }

  console.log(
    `Media job ${job?.id} failed attempt ${job?.attemptsMade}/${job?.opts.attempts}: ${err.message}`,
  );

  const maxAttempts = job.opts.attempts ?? 1;

  if (job.attemptsMade < maxAttempts) {
    console.log(`Retrying job: ${job.id}`);
    return;
  }

  await jobService.updateStatus(job.id, "FAILED");
  await webhookService.sendWebhookNotification(
    job.id,
    job.data.userId,
    "FAILED",
    job.data.webHookEndpointId,
    job.data.type,
    undefined,
    err.message,
  );
});

mediaWorker.on("completed", async (job, result) => {
  if (!job?.id) {
    return;
  }

  console.log(`Media job ${job.id} completed`);
  await webhookService.sendWebhookNotification(
    job.id,
    job.data.userId,
    "COMPLETED",
    job.data.webHookEndpointId,
    job.data.type,
    result.output,
    undefined,
  );
});

function isReadableStream(value: unknown): value is NodeJS.ReadableStream {
  return (
    typeof value === "object" &&
    value !== null &&
    "pipe" in value &&
    typeof (value as { pipe?: unknown }).pipe === "function"
  );
}

async function readImageMetadata(stream: NodeJS.ReadableStream) {
  return await new Promise<sharp.Metadata>((resolve, reject) => {
    const image = sharp();

    stream.on("error", reject);
    image.on("error", reject);
    image.metadata().then(resolve, reject);
    stream.pipe(image);
  });
}

function getOutputMimeType(
  data: ImageJobPayload,
  sourceMimeType: string,
): string {
  if (data.type === "image.transcode") {
    return mimeTypesByFormat[data.options.format];
  }

  return sourceMimeType;
}

function getOutputFilename(
  sourceFilename: string,
  type: ImageJobNames,
  mimeType: string,
) {
  const parsed = path.parse(sourceFilename);
  const suffix = type === "image.resize" ? "resized" : "transcoded";
  const extension = extensionsByMimeType[mimeType] ?? parsed.ext.slice(1);

  return `${parsed.name}-${suffix}.${extension}`;
}

const mimeTypesByFormat: Record<
  ImageTranscodePayload["options"]["format"],
  string
> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

const extensionsByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

process.on("SIGTERM", async () => {
  await jobQueue.close();
  await webhookQueue.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
});
