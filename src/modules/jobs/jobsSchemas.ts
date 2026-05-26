import z from "zod";

const jobTypeSchema = z.enum([
  "RESIZE_IMAGE",
  "RESIZE_VIDEO",
  "GENERATE_ALT_TEXT",
]);

const jobStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
]);

// Only job for now is resizing an image
const jobDataSchema = z.object({
  original_width: z.number().int().positive(),
  original_height: z.number().int().positive(),
  target_width: z.number().int().positive(),
  target_height: z.number().int().positive(),
});

const jobResponseSchema = z.object({
  jobId: z.string(),
  jobType: jobTypeSchema,
  status: jobStatusSchema,
  data: jobDataSchema,
});

export const createJobBodySchema = z.object({
  jobType: jobTypeSchema,
  data: jobDataSchema,
});

export const createJobResponseSchema = jobResponseSchema;

export const getJobParamsSchema = z.object({
  id: z.string().min(1),
});

export const getJobResponseSchema = jobResponseSchema;
export const listJobsResponseSchema = z.array(jobResponseSchema);

export type CreateJobBody = z.infer<typeof createJobBodySchema>;
export type CreateJobReply = z.infer<typeof createJobResponseSchema>;
export type GetJobParams = z.infer<typeof getJobParamsSchema>;
export type GetJobReply = z.infer<typeof getJobResponseSchema>;
export type ListJobsReply = z.infer<typeof listJobsResponseSchema>;
