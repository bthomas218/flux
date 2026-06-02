import { Worker } from "bullmq";
import { cfg } from "../cfg.js";
import type {
  WebhookJobPayload,
  WebhookJobNames,
} from "../types/webhookJobTypes.js";
import { prisma } from "../lib/prisma.js";
import { decrypt } from "../lib/crypto.js";

//TODO: send an actual webhook
const connection = cfg.redis;
const webhookWorker = new Worker<WebhookJobPayload, void, WebhookJobNames>(
  "webhook",
  async (job) => {
    const EncryptedWebhookSecret = await prisma.user.findUnique({
      where: {
        id: job.data.userId,
      },
      select: {
        webhookSecret: true,
      },
    });

    console.dir(EncryptedWebhookSecret, { depth: null });

    const [iv, data, tag] = (EncryptedWebhookSecret?.webhookSecret || "").split(
      ":",
    );

    if (!iv || !data || !tag) {
      console.log(`Invalid webhook secret for user ${job.data.userId}`);
      throw new Error("Invalid webhook secret for user");
    }

    const webhookSecret = await decrypt(cfg.ENCRYPTION_KEY, iv, data, tag);
    console.log(
      `Decrypted webhook secret for user ${job.data.userId}: ${webhookSecret}`,
    );
    switch (job.data.event) {
      case "job.completed":
        console.log(
          `Webhook: Job completed for jobId ${job.data.jobId}, type ${job.data.type}`,
        );
        await fetch(cfg.WEBHOOK_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": webhookSecret,
          },
          body: JSON.stringify(job.data),
        });
        break;
      case "job.failed":
        console.log(
          `Webhook: Job failed for jobId ${job.data.jobId}, type ${job.data.type}, error: ${job.data.error.message}`,
        );
        await fetch(cfg.WEBHOOK_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": webhookSecret,
          },
          body: JSON.stringify(job.data),
        });
        break;
      default:
        throw new Error(`Unknown webhook event`);
    }
  },
  { connection },
);
