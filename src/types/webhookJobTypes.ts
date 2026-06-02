import type { ImageJobNames } from "./imageJobTypes.js";
export type WebhookJobNames = "job.completed" | "job.failed";

export type WebhookJobPayload =
  | {
      event: "job.completed";
      type: ImageJobNames;
      jobId: string;
      userId: string;
      webHookEndpointId: string;
      status: "COMPLETED";
      result: {
        inputFileId: string;
        outputFileId: string;
      };
    }
  | {
      event: "job.failed";
      type: ImageJobNames;
      userId: string;
      jobId: string;
      webHookEndpointId: string;
      status: "FAILED";
      error: {
        message: string;
      };
    };
