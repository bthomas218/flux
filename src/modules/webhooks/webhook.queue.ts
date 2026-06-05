import { Queue } from "bullmq";
import { Redis } from "ioredis";

import type { WebhookJobPayload, WebhookJobNames } from "./types.js";

export const MAX_WEBHOOK_JOB_RETRY_ATTEMPTS = 5;

export function createWebhookQueue(connection: Redis) {
  return new Queue<WebhookJobPayload, void, WebhookJobNames>("webhook", {
    connection,
  });
}
