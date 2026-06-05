export type WebhookJobNames = "job.completed" | "job.failed";

export type WebhookJobPayload =
  | {
      event: "job.completed";
      type: string;
      jobId: string;
      userId: string;
      webHookEndpointId: string;
      status: "COMPLETED";
      result: {
        width?: number;
        height?: number;
        mimeType?: string;
        altText?: string;
      };
    }
  | {
      event: "job.failed";
      type: string;
      userId: string;
      jobId: string;
      webHookEndpointId: string;
      status: "FAILED";
      error: {
        message: string;
      };
    };
