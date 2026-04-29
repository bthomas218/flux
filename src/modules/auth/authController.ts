import type { FastifyRequest, FastifyReply } from "fastify";
import type { RegisterBody, RegisterReply } from "./authSchemas.js";
import { createUser } from "./authService.js";

export const registerUser = async (
  request: FastifyRequest<{
    Body: RegisterBody;
  }>,
  reply: FastifyReply<{ Reply: RegisterReply }>,
) => {
  const { email } = request.body;
  const { apiKey, webhookSecret: secretKey } = await createUser(email);
  reply.send({ apiKey, secretKey });
};
