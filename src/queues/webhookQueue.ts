import { Queue } from "bullmq";
import { cfg } from "../cfg.js";

import type {
  WebhookJobPayload,
  WebhookJobNames,
} from "../types/webhookJobTypes.js";

const connection = cfg.redis;

export const MAX_WEBHOOK_JOB_RETRY_ATTEMPTS = 5;
export const webhookQueue = new Queue<WebhookJobPayload, void, WebhookJobNames>(
  "webhook",
  { connection },
);
