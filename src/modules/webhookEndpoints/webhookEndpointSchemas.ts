import { z } from "zod";

const webhookEndpointMetadataSchema = z.object({
  id: z.string(),
  url: z.url(),
  createdAt: z.date(),
});

export const createWebhookEndpointBodySchema = z.object({
  url: z.url(),
});

export const createWebhookEndpointResponseSchema =
  webhookEndpointMetadataSchema;

export const listWebhookEndpointsResponseSchema = z.array(
  webhookEndpointMetadataSchema,
);

export const deleteWebhookEndpointParamsSchema = z.object({
  id: z.string().min(1),
});

export const deleteWebhookEndpointResponseSchema = z.object({
  success: z.boolean(),
});

export type CreateWebhookEndpointBody = z.infer<
  typeof createWebhookEndpointBodySchema
>;
export type CreateWebhookEndpointReply = z.infer<
  typeof createWebhookEndpointResponseSchema
>;
export type ListWebhookEndpointsReply = z.infer<
  typeof listWebhookEndpointsResponseSchema
>;
export type DeleteWebhookEndpointParams = z.infer<
  typeof deleteWebhookEndpointParamsSchema
>;
export type DeleteWebhookEndpointReply = z.infer<
  typeof deleteWebhookEndpointResponseSchema
>;
