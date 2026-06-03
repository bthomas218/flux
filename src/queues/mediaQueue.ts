import { Queue } from "bullmq";
import { cfg } from "../cfg.js";
import type {
  ImageJobNames,
  ImageJobPayload,
  ImageResultPayLoad,
} from "../types/imageJobTypes.js";

const connection = cfg.redis;

export const MAX_JOB_RETRY_ATTEMPTS = 3;

export const mediaQueue = new Queue<
  ImageJobPayload,
  ImageResultPayLoad,
  ImageJobNames
>("media", { connection });
