import { Redis } from "ioredis";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redisPlugin(app: FastifyInstance) {
  const connectionString = app.cfg.REDIS_URL;

  const redis = connectionString
    ? new Redis(connectionString, { maxRetriesPerRequest: null })
    : new Redis({ maxRetriesPerRequest: null }); // Default: localhost:6379,

  await redis.ping();

  app.decorate("redis", redis);

  app.addHook("onClose", async () => {
    await redis.quit();
  });
}

export default fp(redisPlugin, {
  name: "redis",
  dependencies: ["config"],
});
