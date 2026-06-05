import { Worker } from "bullmq";
import { cfg } from "../../config/cfg.js";

import type {
  ImageJobNames,
  ImageJobPayload,
  ImageResultPayLoad,
  ImageAltTextPayload,
} from "./types.js";
import resizeProcessor from "./processors/image/resizeProcessor.js";
import transcodeProcessor from "./processors/image/transcodeProcessor.js";
import { createWebhookService } from "../webhooks/webhook.service.js";
import { createWebhookQueue } from "../webhooks/webhook.queue.js";
import { createPrismaClient } from "../../lib/prisma.js";
import { createJobService } from "./job.service.js";
import { createRedis } from "../../lib/redis.js";
import { createFileMetadataService } from "../files/file-metadata.service.js";
import { FileStorageService } from "../files/file-storage.service.js";
import { createJobQueue } from "./job.queue.js";

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
    switch (job.data.type) {
      // Mark in progress
      case "image.resize":
        return await resizeProcessor(job.data, job.id!, jobService);
      case "image.transcode":
        return await transcodeProcessor(job.data, job.id!, jobService);
      case "image.alttext":
        return await altTextProcessor(job.data);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
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
    job.data.fileId,
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
    job.data.fileId,
    job.data.webHookEndpointId,
    job.data.type,
    result,
    undefined,
  );
});

// Implement the logic for image alt text job
const altTextProcessor = async (
  data: ImageAltTextPayload,
): Promise<ImageResultPayLoad> => {
  return {
    type: "image.alttext",
    output: {
      altText: "Fake alt text",
    },
  };
};

process.on("SIGTERM", async () => {
  await jobQueue.close();
  await webhookQueue.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
});
