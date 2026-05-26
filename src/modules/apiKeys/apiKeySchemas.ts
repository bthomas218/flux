import { z } from "zod";

const apiKeyMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  prefix: z.string(),
  lastUsedAt: z.date().nullable(),
  revokedAt: z.date().nullable(),
  createdAt: z.date(),
});

export const createApiKeyBodySchema = z.object({
  name: z.string().min(1).max(100),
});

export const createApiKeyResponseSchema = apiKeyMetadataSchema.extend({
  apiKey: z.string(),
});

export const listApiKeysResponseSchema = z.array(apiKeyMetadataSchema);

export const deleteApiKeyParamsSchema = z.object({
  id: z.string().min(1),
});

export const deleteApiKeyResponseSchema = z.object({
  success: z.boolean(),
});

export type CreateApiKeyBody = z.infer<typeof createApiKeyBodySchema>;
export type CreateApiKeyReply = z.infer<typeof createApiKeyResponseSchema>;
export type ListApiKeysReply = z.infer<typeof listApiKeysResponseSchema>;
export type DeleteApiKeyParams = z.infer<typeof deleteApiKeyParamsSchema>;
export type DeleteApiKeyReply = z.infer<typeof deleteApiKeyResponseSchema>;
