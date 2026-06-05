import { Redis } from "ioredis";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { createRedis } from "../lib/redis.js";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redisPlugin(app: FastifyInstance) {
  const connectionString = app.cfg.REDIS_URL;

  const redis = createRedis(connectionString);

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
