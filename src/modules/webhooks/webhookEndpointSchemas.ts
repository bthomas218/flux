import { z } from "zod";

const webhookEndpointMetadataSchema = z.object({
  id: z.string(),
  url: z.url(),
  createdAt: z.date(),
});

export const createWebhookEndpointBodySchema = z.object({
  url: z.url(),
});

export const createWebhookEndpointResponseSchema = z.object({
  id: z.string(),
  url: z.url(),
  createdAt: z.date(),
  secret: z.string(), //Sent only once on creation
});

export const listWebhookEndpointsResponseSchema = z.array(
  webhookEndpointMetadataSchema,
);

export const getWebhookEndpointParamsSchema = z.object({
  id: z.string().min(1),
});

export const getWebhookEndpointResponseSchema = webhookEndpointMetadataSchema;

export const deleteWebhookEndpointParamsSchema = z.object({
  id: z.string().min(1),
});

export const deleteWebhookEndpointResponseSchema = z.object({
  success: z.boolean(),
});

export const updateWebhookEndpointParamsSchema = z.object({
  id: z.string().min(1),
});

export const updateWebhookEndpointBodySchema = z.object({
  url: z.url(),
});

export const updateWebhookEndpointResponseSchema = webhookEndpointMetadataSchema;

export type CreateWebhookEndpointBody = z.infer<
  typeof createWebhookEndpointBodySchema
>;
export type CreateWebhookEndpointReply = z.infer<
  typeof createWebhookEndpointResponseSchema
>;
export type ListWebhookEndpointsReply = z.infer<
  typeof listWebhookEndpointsResponseSchema
>;
export type GetWebhookEndpointParams = z.infer<
  typeof getWebhookEndpointParamsSchema
>;
export type GetWebhookEndpointReply = z.infer<
  typeof getWebhookEndpointResponseSchema
>;
export type DeleteWebhookEndpointParams = z.infer<
  typeof deleteWebhookEndpointParamsSchema
>;
export type DeleteWebhookEndpointReply = z.infer<
  typeof deleteWebhookEndpointResponseSchema
>;
export type UpdateWebhookEndpointParams = z.infer<
  typeof updateWebhookEndpointParamsSchema
>;
export type UpdateWebhookEndpointBody = z.infer<
  typeof updateWebhookEndpointBodySchema
>;
export type UpdateWebhookEndpointReply = z.infer<
  typeof updateWebhookEndpointResponseSchema
>;
