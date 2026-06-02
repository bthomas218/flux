import { z } from "zod";
import "dotenv/config";
import { Redis } from "ioredis";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  HOSTNAME: z.string().min(1).default("localhost"),
  DATABASE_URL: z.url(),
  ENCRYPTION_KEY: z.hex().length(64),
  TOKEN_HASH_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  REDIS_URL: z.url().optional(),
  WEBHOOK_URL: z.url().optional(), //This is temporary for testing the webhook worker, in a real application this would be set by the user and stored encrypted in the database, then decrypted by the worker when sending the webhook notification
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid enviroment variables");
  const err = z.treeifyError(parsed.error);
  console.error(err.properties);
  process.exit(1);
}

export const cfg = {
  ...parsed.data,
  redis: parsed.data.REDIS_URL
    ? new Redis(parsed.data.REDIS_URL, { maxRetriesPerRequest: null })
    : new Redis({ maxRetriesPerRequest: null }), // Default: localhost:6379,
};
