import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { cfg } from "../../cfg.js";
import {
  createWebhookEndpointHandler,
  deleteWebhookEndpointHandler,
  listWebhookEndpointsHandler,
} from "./webhookEndpointController.js";
import {
  createWebhookEndpointBodySchema,
  createWebhookEndpointResponseSchema,
  deleteWebhookEndpointParamsSchema,
  deleteWebhookEndpointResponseSchema,
  listWebhookEndpointsResponseSchema,
} from "./webhookEndpointSchemas.js";

export async function webhookEndpointRoutes(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: cfg.JWT_SECRET,
  });

  app.addHook("preHandler", async (request) => {
    await request.jwtVerify();
  });

  app.withTypeProvider<ZodTypeProvider>().post(
    "/webhooks",
    {
      schema: {
        body: createWebhookEndpointBodySchema,
        response: {
          201: createWebhookEndpointResponseSchema,
        },
      },
    },
    createWebhookEndpointHandler,
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/webhooks",
    {
      schema: {
        response: {
          200: listWebhookEndpointsResponseSchema,
        },
      },
    },
    listWebhookEndpointsHandler,
  );

  app.withTypeProvider<ZodTypeProvider>().delete(
    "/webhooks/:id",
    {
      schema: {
        params: deleteWebhookEndpointParamsSchema,
        response: {
          200: deleteWebhookEndpointResponseSchema,
        },
      },
    },
    deleteWebhookEndpointHandler,
  );
}
