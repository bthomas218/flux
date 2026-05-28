import { Worker } from "bullmq";
import { cfg } from "../cfg.js";
import { prisma } from "../lib/prisma.js";
const connection = cfg.redis;
import type {
  ImageJobNames,
  ImageJobPayload,
  ImageResultPayLoad,
  ImageResizePayload,
} from "../types/imageJobTypes.js";

// Spoof job for now
const mediaWorker = new Worker<
  ImageJobPayload,
  ImageResultPayLoad,
  ImageJobNames
>(
  "media",
  async (job) => {
    switch (job.name) {
      case "image.resize":
        return await resizeProcessor(job.data as ImageResizePayload);
      case "image.transcode":
        return await transcodeProcessor(job.data);
      case "image.alttext":
        return await altTextProcessor(job.data);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  },
  { connection },
);

// TODO: Implement the logic for image transcode job
const resizeProcessor = async (
  data: ImageResizePayload,
): Promise<ImageResultPayLoad> => {
  return {
    type: "image.resize",
    output: {
      fileId: data.fileId,
      storageKey: "fake-storage-key",
      mimeType: "image/jpeg",
      width: data.options.width || 100,
      height: data.options.height || 100,
    },
  };
};

// TODO: Implement the logic for image transcode job
const transcodeProcessor = async (
  data: ImageJobPayload,
): Promise<ImageResultPayLoad> => {
  return {
    type: "image.transcode",
    output: {
      fileId: data.fileId,
      storageKey: "fake-storage-key",
      mimeType: "image/jpeg",
      width: 100,
      height: 100,
    },
  };
};

// Implement the logic for image alt text job
const altTextProcessor = async (
  data: ImageJobPayload,
): Promise<ImageResultPayLoad> => {
  return {
    type: "image.alttext",
    output: {
      altText: "Fake alt text",
    },
  };
};
