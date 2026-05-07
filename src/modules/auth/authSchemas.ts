import { success, z } from "zod";

export const registerBodySchema = z.object({
  email: z.email(),
  keyName: z.string().optional(),
});

export const registerResponseSchema = z.object({
  apiKey: z.string(),
  secretKey: z.string(),
});

export const magicLinkBodySchema = z.object({
  email: z.email(),
});

export const magicLinkResponseSchema = z.object({
  success: z.boolean(),
  callbackUrl: z.url(),
  token: z.hex(),
});

export const callbackQuerySchema = z.object({
  token: z.hex(),
});

export const callbackResponseSchema = z.object({
  success: z.boolean(),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type RegisterReply = z.infer<typeof registerResponseSchema>;
export type MagicLinkBody = z.infer<typeof magicLinkBodySchema>;
export type MagicLinkReply = z.infer<typeof magicLinkResponseSchema>;
export type CallbackQuery = z.infer<typeof callbackQuerySchema>;
