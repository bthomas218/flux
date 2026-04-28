import type { FastifyRequest, FastifyReply } from "fastify";
import { generateAPIKey, generateSecretKey } from "./authService.js";
import type { RegisterBody, RegisterReply } from "./authSchemas.js";

export const registerUser = async (
  request: FastifyRequest<{
    Body: RegisterBody;
  }>,
  reply: FastifyReply<{ Reply: RegisterReply }>,
) => {
  const { email } = request.body;
  reply.send({ apiKey: generateAPIKey(), secretKey: generateSecretKey() });
};
