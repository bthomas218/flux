import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type { WebhookJobPayload, WebhookJobNames } from "./types.js";
import {
  MAX_WEBHOOK_JOB_RETRY_ATTEMPTS,
  QUEUE_RETRY_DELAY,
} from "../../lib/constants.js";

export function createWebhookQueue(connection: Redis) {
  return new Queue<WebhookJobPayload, void, WebhookJobNames>("webhook", {
    defaultJobOptions: {
      attempts: MAX_WEBHOOK_JOB_RETRY_ATTEMPTS,
      backoff: {
        type: "exponential",
        delay: QUEUE_RETRY_DELAY,
      },
    },
    connection,
  });
}
