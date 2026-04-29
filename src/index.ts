import Fastify, { type FastifyError } from "fastify";
import { cfg } from "./cfg.js";
import { authRoutes } from "./modules/auth/authRoutes.js";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";

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

  const statusCode = error.statusCode || 500;

  if (statusCode === 500) app.log.error(error);

  reply.status(statusCode).send({
    error: error.name || "Error",
    message: statusCode === 500 ? "Internal Server Error" : error.message,
  });
});

app.get("/health", async (request, reply) => {
  return { status: "OK" };
});
app.register(authRoutes, { prefix: "auth" });

async function main() {
  try {
    await app.listen({ port: cfg.PORT, host: cfg.HOSTNAME });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
