import { Worker } from "bullmq";
import { cfg } from "../../cfg.js";

const connection = cfg.redis;
import type {
  ImageJobNames,
  ImageJobPayload,
  ImageResultPayLoad,
  ImageAltTextPayload,
} from "./types.js";
import resizeProcessor from "./processors/image/resizeProcessor.js";
import transcodeProcessor from "./processors/image/transcodeProcessor.js";
import { sendWebhookNotification } from "../../workers/jobUtils.js";
import { updateJobStatus } from "./jobsService.js";

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
        return await transcodeProcessor(job.data, job.id!);
      case "image.alttext":
        return await altTextProcessor(job.data);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  },
  { connection },
);
mediaWorker.on("failed", async (job, err) => {
  if (!job?.id) {
    return;
  }

  console.log(
    `Media job ${job?.id} failed attempt ${job?.attemptsMade}/${job?.opts.attempts}: ${err.message}`,
  );

  const maxAttempts = job.opts.attempts ?? 1;

  if (job.attemptsMade < maxAttempts) {
    console.log(`Retrying job: ${job.id}`);
    return;
  }

  await updateJobStatus(job.id, "FAILED");
  await sendWebhookNotification(
    job.id,
    job.data.userId,
    "FAILED",
    job.data.fileId,
    job.data.webHookEndpointId,
    job.data.type,
    undefined,
    err.message,
  );
});

mediaWorker.on("completed", async (job, result) => {
  if (!job?.id) {
    return;
  }

  console.log(`Media job ${job.id} completed`);
  await sendWebhookNotification(
    job.id,
    job.data.userId,
    "COMPLETED",
    job.data.fileId,
    job.data.webHookEndpointId,
    job.data.type,
    result,
    undefined,
  );
});

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
