import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  createJobBodySchema,
  createJobResponseSchema,
  getJobParamsSchema,
  getJobResponseSchema,
  listJobsResponseSchema,
} from "./job.schemas.js";

export function jobRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    await app.apiKeyAuth(request, reply);
  });

  app.withTypeProvider<ZodTypeProvider>().post(
    "/",
    {
      schema: {
        body: createJobBodySchema,
        response: {
          201: createJobResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.apiKey!.userId;
      const job = await app.jobService.create(userId, request.body);

      reply.status(201).send(job);
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/",
    {
      schema: {
        response: {
          200: listJobsResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.apiKey!.userId;

      reply.send(await app.jobService.findMany(userId));
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/:id",
    {
      schema: {
        params: getJobParamsSchema,
        response: {
          200: getJobResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = request.apiKey!.userId;

      reply.send(await app.jobService.findOne(request.params.id, userId));
    },
  );
}
