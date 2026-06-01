import { Worker } from "bullmq";
import { cfg } from "../cfg.js";
import type {
  WebhookJobPayload,
  WebhookJobNames,
} from "../types/webhookJobTypes.js";

//TODO: send an actual webhook
const connection = cfg.redis;
const webhookWorker = new Worker<WebhookJobPayload, void, WebhookJobNames>(
  "webhook",
  async (job) => {
    switch (job.data.event) {
      case "job.completed":
        console.log(
          `Webhook: Job completed for jobId ${job.data.jobId}, type ${job.data.type}`,
        );
        // Here you can implement the logic to send a webhook notification for job completion
        break;
      case "job.failed":
        console.log(
          `Webhook: Job failed for jobId ${job.data.jobId}, type ${job.data.type}, error: ${job.data.error.message}`,
        );
        // Here you can implement the logic to send a webhook notification for job failure
        break;
      default:
        throw new Error(`Unknown webhook event`);
    }
  },
  { connection },
);
