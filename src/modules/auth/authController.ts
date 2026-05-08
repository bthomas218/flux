import type { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import type {
  CallbackQuery,
  CallbackReply,
  MagicLinkBody,
  MagicLinkReply,
} from "./authSchemas.js";
import { sendMagicLink, verifyMagicLinkToken } from "./authService.js";

export const requestMagicLink = async (
  request: FastifyRequest<{
    Body: MagicLinkBody;
  }>,
  reply: FastifyReply<{ Reply: MagicLinkReply }>,
) => {
  const { email } = request.body;
  reply.send(await sendMagicLink(email));
};

export const handleCallback =
  (app: FastifyInstance) =>
  async (
    request: FastifyRequest<{
      Querystring: CallbackQuery;
    }>,
    reply: FastifyReply<{ Reply: CallbackReply }>,
  ) => {
    const { token } = request.query;
    const user = await verifyMagicLinkToken(token); // will throw if invalid or expired
    const jwt = app.jwt.sign({ userId: user.id, email: user.email });
    reply.send({ jwt });
  };
