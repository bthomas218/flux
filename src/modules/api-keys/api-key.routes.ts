import {
  createApiKeyBodySchema,
  createApiKeyResponseSchema,
  deleteApiKeyParamsSchema,
  deleteApiKeyResponseSchema,
  getApiKeyParamsSchema,
  getApiKeyResponseSchema,
  listApiKeysResponseSchema,
  updateApiKeyBodySchema,
  updateApiKeyParamsSchema,
  updateApiKeyResponseSchema,
} from "./api-key.schemas.js";

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { UnauthorizedError } from "../../errors.js";
import type { JwtUser } from "../../types/jwtUser.js";

function getAuthenticatedUser(user: unknown) {
  const jwtUser = user as Partial<JwtUser> | undefined;

  if (!jwtUser?.userId) {
    throw new UnauthorizedError();
  }

  return jwtUser as JwtUser;
}

export async function apiKeyRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    await request.jwtVerify();
  });

  app.withTypeProvider<ZodTypeProvider>().post(
    "/",
    {
      schema: {
        body: createApiKeyBodySchema,
        response: {
          201: createApiKeyResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request.user);
      const apiKey = await app.apiKeyService.create(
        user.userId,
        request.body.name,
      );

      reply.status(201).send(apiKey);
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/",
    {
      schema: {
        response: {
          200: listApiKeysResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request.user);

      reply.send(await app.apiKeyService.findMany(user.userId));
    },
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/:id",
    {
      schema: {
        params: getApiKeyParamsSchema,
        response: {
          200: getApiKeyResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request.user);

      reply.send(
        await app.apiKeyService.findOne(request.params.id, user.userId),
      );
    },
  );

  app.withTypeProvider<ZodTypeProvider>().patch(
    "/:id",
    {
      schema: {
        params: updateApiKeyParamsSchema,
        body: updateApiKeyBodySchema,
        response: {
          200: updateApiKeyResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request.user);

      reply.send(
        await app.apiKeyService.update(
          request.params.id,
          user.userId,
          request.body.name,
        ),
      );
    },
  );

  app.withTypeProvider<ZodTypeProvider>().delete(
    "/:id",
    {
      schema: {
        params: deleteApiKeyParamsSchema,
        response: {
          200: deleteApiKeyResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request.user);

      reply.send(
        await app.apiKeyService.delete(request.params.id, user.userId),
      );
    },
  );
}
