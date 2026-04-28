import type { FastifyInstance } from "fastify";
import { registerUser } from "./authController.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { regiserResponseSchema, registerBodySchema } from "./authSchemas.js";

export async function authRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/register",
    {
      schema: {
        body: registerBodySchema,
        response: {
          200: regiserResponseSchema,
        },
      },
    },
    registerUser,
  );
}
