import type {
  ImageJobNames,
  ImageResultPayLoad,
} from "../modules/jobs/types.js";
export type WebhookJobNames = "job.completed" | "job.failed";

export type WebhookJobPayload =
  | {
      event: "job.completed";
      type: ImageJobNames;
      jobId: string;
      userId: string;
      webHookEndpointId: string;
      status: "COMPLETED";
      result: ImageResultPayLoad;
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
