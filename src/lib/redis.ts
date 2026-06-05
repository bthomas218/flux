import { Redis } from "ioredis";

export function createRedis(connectionString?: string) {
  return connectionString
    ? new Redis(connectionString, { maxRetriesPerRequest: null })
    : new Redis({ maxRetriesPerRequest: null }); // Default: localhost:6379,
}
