import z from "zod";

export const uploadFileResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  url: z.string(),
  storageKey: z.string(),
  size: z.number(),
});

export const getFileParamsSchema = z.object({
  id: z.string().min(1),
});

export const getFileResponseSchema = uploadFileResponseSchema;
export const listFilesResponseSchema = z.array(uploadFileResponseSchema);

export type GetFileParams = z.infer<typeof getFileParamsSchema>;
export type UploadFileReply = z.infer<typeof uploadFileResponseSchema>;
export type GetFileReply = z.infer<typeof getFileResponseSchema>;
export type ListFilesReply = z.infer<typeof listFilesResponseSchema>;
