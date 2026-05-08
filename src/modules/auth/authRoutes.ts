import type { FastifyInstance } from "fastify";
import { handleCallback, requestMagicLink } from "./authController.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  magicLinkBodySchema,
  magicLinkResponseSchema,
  callbackQuerySchema,
  callbackResponseSchema,
} from "./authSchemas.js";
import fastifyJwt from "@fastify/jwt";
import { cfg } from "../../cfg.js";

export async function authRoutes(app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: cfg.JWT_SECRET,
  });

  app.withTypeProvider<ZodTypeProvider>().post(
    "/magic-link",
    {
      schema: {
        body: magicLinkBodySchema,
        response: {
          200: magicLinkResponseSchema,
        },
      },
    },
    requestMagicLink,
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/callback",
    {
      schema: {
        querystring: callbackQuerySchema,
        response: {
          200: callbackResponseSchema,
        },
      },
    },
    handleCallback(app),
  );
}
