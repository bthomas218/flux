import { treeifyError, z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  HOSTNAME: z.string().min(1).default("localhost"),
  DATABASE_URL: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid enviroment variables");
  const err = z.treeifyError(parsed.error);
  console.error(err.properties);
  process.exit(1);
}

export const cfg = parsed.data;
