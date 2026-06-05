import { z } from "zod";

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
  jwt: z.string(),
});

export type MagicLinkBody = z.infer<typeof magicLinkBodySchema>;
export type MagicLinkReply = z.infer<typeof magicLinkResponseSchema>;
export type CallbackQuery = z.infer<typeof callbackQuerySchema>;
export type CallbackReply = z.infer<typeof callbackResponseSchema>;
