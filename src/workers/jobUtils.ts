import { prisma } from "../lib/prisma.js";
import {
  MAX_WEBHOOK_JOB_RETRY_ATTEMPTS,
  webhookQueue,
} from "../queues/webhookQueue.js";
import type { WebhookJobPayload } from "../types/webhookJobTypes.js";
import type {
  ImageJobNames,
  ImageResultPayLoad,
} from "../modules/jobs/types.js";

async function updateJobStatus(
  jobId: string,
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED",
  newFileId?: string,
) {
  const now = new Date();

  const data: {
    status: typeof status;
    outputFileId?: string;
    startedAt?: Date;
    finishedAt?: Date;
  } = {
    status,
  };

  if (status === "IN_PROGRESS") {
    data.startedAt = now;
  } else if (status === "COMPLETED") {
    data.finishedAt = now;
    data.outputFileId = newFileId;
  } else if (status === "FAILED") {
    data.finishedAt = now;
  }

  await prisma.job.update({
    where: {
      id: jobId,
    },
    data,
  });
}

async function sendWebhookNotification(
  jobId: string,
  userId: string,
  status: "COMPLETED" | "FAILED",
  inputFileId: string,
  webhookEndpointId: string,
  jobType: ImageJobNames,
  result?: ImageResultPayLoad,
  errorMessage?: string,
) {
  const payload =
    status === "COMPLETED"
      ? {
          event: "job.completed",
          jobId,
          userId,
          webHookEndpointId: webhookEndpointId,
          status,
          result,
        }
      : {
          event: "job.failed",
          type: jobType,
          jobId,
          userId,
          webHookEndpointId: webhookEndpointId,
          status,
          error: {
            message: errorMessage || "Unknown error",
          },
        };

  await webhookQueue.add(
    status === "COMPLETED" ? "job.completed" : "job.failed",
    payload as WebhookJobPayload,
    {
      attempts: MAX_WEBHOOK_JOB_RETRY_ATTEMPTS,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  );
}

export { sendWebhookNotification, updateJobStatus };
