import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  magicLinkBodySchema,
  magicLinkResponseSchema,
  callbackQuerySchema,
  callbackResponseSchema,
} from "./auth.schemas.js";
export async function authRoutes(app: FastifyInstance) {
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
    async (req, res) => {
      const { email } = req.body;
      const magicLink = await app.authService.sendMagicLink(email);
      res.send(magicLink);
    },
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
    async (req, res) => {
      const { token } = req.query;
      const user = await app.authService.verifyMagicLinkToken(token);
      const jwt = app.jwt.sign({ userId: user.id, email: user.email });
      return { jwt };
    },
  );
}
