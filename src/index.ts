import Fastify, { type FastifyError } from "fastify";
import { cfg } from "./config/cfg.js";
import { jobsRoutes } from "./modules/jobs/jobsRouter.js";
import { filesRoutes } from "./modules/files/filesRouter.js";
import { webhookEndpointRoutes } from "./modules/webhookEndpoints/webhookEndpointRoutes.js";
import configPlugin from "./plugins/config.js";
import prismaPlugin from "./plugins/prisma.js";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { prisma } from "./lib/prisma.js";
import authPlugin from "./modules/auth/auth.plugin.js";
import apiKeyPlugin from "./modules/api-keys/api-key.plugin.js";
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

app.get("/health", async (request, reply) => {
  const pgConnectionCheck = await prisma.$queryRaw`SELECT CURRENT_TIME;`;
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
app.register(authPlugin);
app.register(apiKeyPlugin);
app.register(jobsRoutes);
app.register(filesRoutes);
app.register(webhookEndpointRoutes);

async function main() {
  try {
    await app.listen({ port: cfg.PORT, host: cfg.HOSTNAME });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
