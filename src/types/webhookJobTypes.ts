import type { ImageJobNames } from "./imageJobTypes.js";
export type WebhookJobNames = "job.completed" | "job.failed";

export type WebhookJobPayload =
  | {
      event: "job.completed";
      type: ImageJobNames;
      jobId: string;
      status: "COMPLETED";
      result: {
        inputFileId: string;
        outputFileId: string;
      };
    }
  | {
      event: "job.failed";
      type: ImageJobNames;
      jobId: string;
      status: "FAILED";
      error: {
        message: string;
      };
    };
