import { Worker } from "bullmq";
import { cfg } from "../cfg.js";
import type {
  WebhookJobPayload,
  WebhookJobNames,
} from "../types/webhookJobTypes.js";
import { prisma } from "../lib/prisma.js";
import { decrypt } from "../lib/crypto.js";

const connection = cfg.redis;
const webhookWorker = new Worker<WebhookJobPayload, void, WebhookJobNames>(
  "webhook",
  async (job) => {
    const webhookEndpoint = await prisma.webhookEndpoint.findUnique({
      where: {
        id: job.data.webHookEndpointId,
      },
      select: {
        secret: true,
        url: true,
      },
    });

    if (!webhookEndpoint) {
      console.log(
        `Webhook endpoint not found for id ${job.data.webHookEndpointId}`,
      );
      throw new Error("Webhook endpoint not found");
    }

    const { url, secret } = webhookEndpoint;

    const [iv, data, tag] = secret.split(":");

    if (!iv || !data || !tag) {
      console.log(`Invalid webhook secret for user ${job.data.userId}`);
      throw new Error("Invalid webhook secret for user");
    }

    const webhookSecret = await decrypt(cfg.ENCRYPTION_KEY, iv, data, tag);

    const res = await sendWebhookPayload(url, webhookSecret, job.data);

    if (!res.ok) {
      throw new Error(`Webhook failed with ${res.status}`);
    }
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

async function sendWebhookPayload(
  url: string,
  webhookSecret: string,
  payload: WebhookJobPayload,
) {
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": webhookSecret,
    },
    body: JSON.stringify(payload),
  });
}
