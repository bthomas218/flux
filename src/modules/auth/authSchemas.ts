import { z } from "zod";

export const registerBodySchema = z.object({
  email: z.email(),
  keyName: z.string().optional(),
});

export const regiserResponseSchema = z.object({
  apiKey: z.string(),
  secretKey: z.string(),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type RegisterReply = z.infer<typeof regiserResponseSchema>;
