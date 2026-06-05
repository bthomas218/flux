import Fastify, { type FastifyError } from "fastify";
import { cfg } from "./config/cfg.js";
import configPlugin from "./plugins/config.js";
import prismaPlugin from "./plugins/prisma.js";
import redisPlugin from "./plugins/redis.js";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import authPlugin from "./modules/auth/auth.plugin.js";
import apiKeyPlugin from "./modules/api-keys/api-key.plugin.js";
import filePlugin from "./modules/files/file.plugin.js";
import webhookPlugin from "./modules/webhooks/webhook.plugin.js";
import jobPlugin from "./modules/jobs/job.plugin.js";
import apiKeyAuth from "./plugins/apiKeyAuth.js";
import fastifyJwt from "@fastify/jwt";

const app = Fastify({
  logger:
    cfg.NODE_ENV === "development"
      ? {
          level: "debug",
          transport: {
            target: "pino-pretty",
          },
        }
      : {
          level: "info",
        },
})
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>();

app.setErrorHandler(async (error: FastifyError, request, reply) => {
  if (error.code === "FST_ERR_VALIDATION") {
    return reply.status(400).send({
      error: "ValidationError",
      message: "Invalid Request",
      details: error.validation,
    });
  }

  if (
    error.code === "FST_JWT_AUTHORIZATION_TOKEN_INVALID" ||
    error.code === "FAST_JWT_INVALID_SIGNATURE" ||
    error.message?.includes("signature")
  ) {
    return reply.status(401).send({
      error: "UnauthorizedError",
      message: "Invalid or expired token",
    });
  }

  const statusCode = error.statusCode || 500;

  if (statusCode === 500) app.log.error(error);

  reply.status(statusCode).send({
    error: error.name || "Error",
    message: statusCode === 500 ? "Internal Server Error" : error.message,
  });
});

app.get("/health", async (req, res) => {
  const pgConnectionCheck = await app.prisma.$queryRaw`SELECT CURRENT_TIME;`;
  return {
    status: "OK",
    pgConnectionCheck,
  };
});

await app.register(configPlugin);
app.register(fastifyJwt, {
  secret: app.cfg.JWT_SECRET,
});
app.register(prismaPlugin);
app.register(apiKeyAuth);
app.register(redisPlugin);
app.register(authPlugin);
app.register(apiKeyPlugin);
app.register(filePlugin);
app.register(webhookPlugin);
app.register(jobPlugin);

async function main() {
  try {
    await app.listen({ port: app.cfg.PORT, host: app.cfg.HOSTNAME });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
