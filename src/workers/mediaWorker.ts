import { Worker } from "bullmq";
import { cfg } from "../cfg.js";

const connection = cfg.redis;
import type {
  ImageJobNames,
  ImageJobPayload,
  ImageResultPayLoad,
  ImageTranscodePayload,
  ImageAltTextPayload,
} from "../types/imageJobTypes.js";
import resizeProcessor from "./processors/image/resizeProcessor.js";

const mediaWorker = new Worker<
  ImageJobPayload,
  ImageResultPayLoad,
  ImageJobNames
>(
  "media",
  async (job) => {
    switch (job.data.type) {
      case "image.resize":
        return await resizeProcessor(job.data, job.id!);
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
const transcodeProcessor = async (
  data: ImageTranscodePayload,
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
  data: ImageAltTextPayload,
): Promise<ImageResultPayLoad> => {
  return {
    type: "image.alttext",
    output: {
      altText: "Fake alt text",
    },
  };
};
