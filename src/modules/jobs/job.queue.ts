import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type {
  ImageJobNames,
  ImageJobPayload,
  ImageResultPayLoad,
} from "./types.js";
import {
  MAX_JOB_RETRY_ATTEMPTS,
  QUEUE_RETRY_DELAY,
} from "../../lib/constants.js";

export function createJobQueue(connection: Redis) {
  return new Queue<ImageJobPayload, ImageResultPayLoad, ImageJobNames>(
    "media",
    {
      defaultJobOptions: {
        attempts: MAX_JOB_RETRY_ATTEMPTS,
        backoff: {
          type: "exponential",
          delay: QUEUE_RETRY_DELAY,
        },
      },
      connection,
    },
  );
}
