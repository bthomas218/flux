import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { cfg } from "../../cfg.js";
import {
  createApiKeyHandler,
  deleteApiKeyHandler,
  listApiKeysHandler,
} from "./apiKeyController.js";
import {
  createApiKeyBodySchema,
  createApiKeyResponseSchema,
  deleteApiKeyParamsSchema,
  deleteApiKeyResponseSchema,
  listApiKeysResponseSchema,
} from "./apiKeySchemas.js";

export async function apiKeyRoutes(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: cfg.JWT_SECRET,
  });

  app.addHook("preHandler", async (request) => {
    await request.jwtVerify();
  });

  app.withTypeProvider<ZodTypeProvider>().post(
    "/api-keys",
    {
      schema: {
        body: createApiKeyBodySchema,
        response: {
          201: createApiKeyResponseSchema,
        },
      },
    },
    createApiKeyHandler,
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/api-keys",
    {
      schema: {
        response: {
          200: listApiKeysResponseSchema,
        },
      },
    },
    listApiKeysHandler,
  );

  app.withTypeProvider<ZodTypeProvider>().delete(
    "/api-keys/:id",
    {
      schema: {
        params: deleteApiKeyParamsSchema,
        response: {
          200: deleteApiKeyResponseSchema,
        },
      },
    },
    deleteApiKeyHandler,
  );
}
