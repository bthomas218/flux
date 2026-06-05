import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type {
  ImageJobNames,
  ImageJobPayload,
  ImageResultPayLoad,
} from "./types.js";

export const MAX_JOB_RETRY_ATTEMPTS = 3;

export function createJobQueue(connection: Redis) {
  return new Queue<ImageJobPayload, ImageResultPayLoad, ImageJobNames>(
    "media",
    { connection },
  );
}
