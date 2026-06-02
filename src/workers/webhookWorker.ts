import { Worker } from "bullmq";
import { cfg } from "../cfg.js";
import type {
  WebhookJobPayload,
  WebhookJobNames,
} from "../types/webhookJobTypes.js";
import { prisma } from "../lib/prisma.js";
import { decrypt } from "../lib/crypto.js";

type WebhookEndpointRecord = {
  url: string;
};

const connection = cfg.redis;
const webhookWorker = new Worker<WebhookJobPayload, void, WebhookJobNames>(
  "webhook",
  async (job) => {
    const encryptedWebhookSecret = await prisma.user.findUnique({
      where: {
        id: job.data.userId,
      },
      select: {
        webhookSecret: true,
      },
    });

    const [iv, data, tag] = (encryptedWebhookSecret?.webhookSecret || "").split(
      ":",
    );

    if (!iv || !data || !tag) {
      console.log(`Invalid webhook secret for user ${job.data.userId}`);
      throw new Error("Invalid webhook secret for user");
    }

    const webhookSecret = await decrypt(cfg.ENCRYPTION_KEY, iv, data, tag);

    const endpoints = await prisma.$queryRaw<WebhookEndpointRecord[]>`
      SELECT "url"
      FROM "WebhookEndpoint"
      WHERE "userId" = ${job.data.userId}
    `;

    if (endpoints.length === 0) {
      console.log(`No webhook endpoints configured for user ${job.data.userId}`);
      return;
    }

    switch (job.data.event) {
      case "job.completed":
        console.log(
          `Webhook: Job completed for jobId ${job.data.jobId}, type ${job.data.type}`,
        );
        await sendWebhookPayload(endpoints, webhookSecret, job.data);
        break;
      case "job.failed":
        console.log(
          `Webhook: Job failed for jobId ${job.data.jobId}, type ${job.data.type}, error: ${job.data.error.message}`,
        );
        await sendWebhookPayload(endpoints, webhookSecret, job.data);
        break;
      default:
        throw new Error(`Unknown webhook event`);
    }
  },
  { connection },
);

async function sendWebhookPayload(
  endpoints: WebhookEndpointRecord[],
  webhookSecret: string,
  payload: WebhookJobPayload,
) {
  await Promise.all(
    endpoints.map((endpoint) =>
      fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": webhookSecret,
        },
        body: JSON.stringify(payload),
      }),
    ),
  );
}
