import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import apiKeyAuth from "../../plugins/apiKeyAuth.js";
import { createJobHandler } from "./jobsController.js";

export function jobsRoutes(app: FastifyInstance) {
  app.register(apiKeyAuth);

  app.addHook("preHandler", async (request, reply) => {
    await app.apiKeyAuth(request, reply);
  });

  app.withTypeProvider<ZodTypeProvider>().post(
    "/jobs",
    {
      schema: {},
    },
    createJobHandler,
  );
}
