import type { FastifyRequest, FastifyReply } from "fastify";
import type {
  MagicLinkBody,
  MagicLinkReply,
  RegisterBody,
  RegisterReply,
} from "./authSchemas.js";
import { createUser, sendMagicLink } from "./authService.js";

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
