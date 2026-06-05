import { Worker } from "bullmq";
import { cfg } from "../../config/cfg.js";
import type { WebhookJobPayload, WebhookJobNames } from "./types.js";
import { createPrismaClient } from "../../lib/prisma.js";
import { createRedis } from "../../lib/redis.js";
import { createWebhookService } from "./webhook.service.js";
import { createWebhookQueue } from "./webhook.queue.js";

const connection = createRedis(cfg.REDIS_URL);
const prisma = createPrismaClient(cfg.DATABASE_URL);

const webhookQueue = createWebhookQueue(connection);
const webhookService = createWebhookService(prisma, webhookQueue, cfg);

const webhookWorker = new Worker<WebhookJobPayload, void, WebhookJobNames>(
  "webhook",
  async (job) => {
    await webhookService.deliverWebhook(job.data);
  },
  { connection },
);

webhookWorker.on("failed", (job, err) => {
  console.log(
    `Webhook job ${job?.id} failed attempt ${job?.attemptsMade}/${job?.opts.attempts}: ${err.message}`,
  );
});

webhookWorker.on("completed", (job) => {
  console.log(`Webhook job ${job.id} completed`);
});

process.on("SIGTERM", async () => {
  await webhookQueue.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
});
