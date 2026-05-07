import type { FastifyRequest, FastifyReply } from "fastify";
import type {
  CallbackQuery,
  MagicLinkBody,
  MagicLinkReply,
  RegisterBody,
  RegisterReply,
} from "./authSchemas.js";
import {
  createUser,
  sendMagicLink,
  verifyMagicLinkToken,
} from "./authService.js";

export const registerUser = async (
  request: FastifyRequest<{
    Body: RegisterBody;
  }>,
  reply: FastifyReply<{ Reply: RegisterReply }>,
) => {
  const { email, keyName } = request.body;
  reply.send(await createUser(email, keyName));
};

export const requestMagicLink = async (
  request: FastifyRequest<{
    Body: MagicLinkBody;
  }>,
  reply: FastifyReply<{ Reply: MagicLinkReply }>,
) => {
  const { email } = request.body;
  reply.send(await sendMagicLink(email));
};

export const handleCallback = async (
  request: FastifyRequest<{
    Querystring: CallbackQuery;
  }>,
  reply: FastifyReply,
) => {
  const { token } = request.query;
  const user = await verifyMagicLinkToken(token); // will throw if invalid or expired

  reply.send({ user }); // TODO: send JWT after verifying token
};
