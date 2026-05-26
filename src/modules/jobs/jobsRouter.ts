import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import apiKeyAuth from "../../plugins/apiKeyAuth.js";
import {
  createJobHandler,
  getJobHandler,
  listJobsHandler,
} from "./jobsController.js";
import {
  createJobResponseSchema,
  createJobBodySchema,
  getJobParamsSchema,
  getJobResponseSchema,
  listJobsResponseSchema,
} from "./jobsSchemas.js";

export function jobsRoutes(app: FastifyInstance) {
  app.register(apiKeyAuth);

  app.addHook("preHandler", async (request, reply) => {
    await app.apiKeyAuth(request, reply);
  });

  app.withTypeProvider<ZodTypeProvider>().post(
    "/jobs",
    {
      schema: {
        body: createJobBodySchema,
        response: {
          201: createJobResponseSchema,
        },
      },
    },
    createJobHandler,
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/jobs",
    {
      schema: {
        response: {
          200: listJobsResponseSchema,
        },
      },
    },
    listJobsHandler,
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/jobs/:id",
    {
      schema: {
        params: getJobParamsSchema,
        response: {
          200: getJobResponseSchema,
        },
      },
    },
    getJobHandler,
  );
}
