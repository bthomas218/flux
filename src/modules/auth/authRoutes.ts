import type { FastifyInstance } from "fastify";
import { registerUser, requestMagicLink } from "./authController.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  registerResponseSchema,
  registerBodySchema,
  magicLinkBodySchema,
  magicLinkResponseSchema,
} from "./authSchemas.js";

export async function authRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/register",
    {
      schema: {
        body: registerBodySchema,
        response: {
          200: registerResponseSchema,
        },
      },
    },
    registerUser,
  );

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
}
