import z from "zod";
import type { ImageJobPayload } from "../../types/imageJobTypes.js";

const jobTypeSchema = z.enum([
  "image.resize",
  "image.transcode",
  "image.alttext",
]);

const jobStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "failed",
]);

const imageResizeBodySchema = z.object({
  type: z.literal("image.resize"),
  fileId: z.string().min(1),
  webHookEndpointId: z.string().min(1),
  options: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).optional(),
  }),
});

const imageTranscodeBodySchema = z.object({
  type: z.literal("image.transcode"),
  fileId: z.string().min(1),
  webHookEndpointId: z.string().min(1),
  options: z.object({
    format: z.enum(["jpeg", "png", "webp", "avif"]),
    quality: z.number().optional(),
  }),
});

const imageAltTextBodySchema = z.object({
  type: z.literal("image.alttext"),
  fileId: z.string().min(1),
  webHookEndpointId: z.string().min(1),
  options: z.object({}).optional(),
});

export const createJobBodySchema = z.discriminatedUnion("type", [
  imageResizeBodySchema,
  imageTranscodeBodySchema,
  imageAltTextBodySchema,
]);

export const createJobResponseSchema = z.object({
  jobId: z.string(),
  fileId: z.string(),
  outputFileId: z.string().nullable(),
  jobType: jobTypeSchema,
  status: jobStatusSchema,
  options: z.union([
    imageResizeBodySchema.shape.options,
    imageTranscodeBodySchema.shape.options,
    imageAltTextBodySchema.shape.options,
  ]),
});

export const getJobParamsSchema = z.object({
  id: z.string().min(1),
});

export const getJobResponseSchema = createJobResponseSchema;
export const listJobsResponseSchema = z.array(createJobResponseSchema);

export type CreateJobBody = z.infer<typeof createJobBodySchema>;
export type CreateJobReply = z.infer<typeof createJobResponseSchema>;
export type GetJobParams = z.infer<typeof getJobParamsSchema>;
export type GetJobReply = z.infer<typeof getJobResponseSchema>;
export type ListJobsReply = z.infer<typeof listJobsResponseSchema>;
