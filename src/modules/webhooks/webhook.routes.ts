import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { UnauthorizedError } from "../../errors.js";
import type { JwtUser } from "../../types/jwtUser.js";
import {
  createWebhookEndpointBodySchema,
  createWebhookEndpointResponseSchema,
  deleteWebhookEndpointParamsSchema,
  deleteWebhookEndpointResponseSchema,
  getWebhookEndpointParamsSchema,
  getWebhookEndpointResponseSchema,
  listWebhookEndpointsResponseSchema,
  updateWebhookEndpointBodySchema,
  updateWebhookEndpointParamsSchema,
  updateWebhookEndpointResponseSchema,
} from "./webhookEndpointSchemas.js";

function getAuthenticatedUser(user: unknown) {
  const jwtUser = user as Partial<JwtUser> | undefined;

  if (!jwtUser?.userId) {
    throw new UnauthorizedError();
  }

  return jwtUser as JwtUser;
}

export async function webhookRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await request.jwtVerify();
  });

  app.withTypeProvider<ZodTypeProvider>().post(
    "/",
    {
      schema: {
        body: createWebhookEndpointBodySchema,
        response: {
          201: createWebhookEndpointResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request.user);
      const endpoint = await app.webhookService.create(
        user.userId,
        request.body.url,
      );

      reply.status(201).send(endpoint);
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/",
    {
      schema: {
        response: {
          200: listWebhookEndpointsResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request.user);

      reply.send(await app.webhookService.findMany(user.userId));
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/:id",
    {
      schema: {
        params: getWebhookEndpointParamsSchema,
        response: {
          200: getWebhookEndpointResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request.user);

      reply.send(await app.webhookService.findOne(request.params.id, user.userId));
    },
  );

  app.withTypeProvider<ZodTypeProvider>().patch(
    "/:id",
    {
      schema: {
        params: updateWebhookEndpointParamsSchema,
        body: updateWebhookEndpointBodySchema,
        response: {
          200: updateWebhookEndpointResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request.user);

      reply.send(
        await app.webhookService.update(
          request.params.id,
          user.userId,
          request.body.url,
        ),
      );
    },
  );

  app.withTypeProvider<ZodTypeProvider>().delete(
    "/:id",
    {
      schema: {
        params: deleteWebhookEndpointParamsSchema,
        response: {
          200: deleteWebhookEndpointResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request.user);

      reply.send(await app.webhookService.delete(request.params.id, user.userId));
    },
  );
}
