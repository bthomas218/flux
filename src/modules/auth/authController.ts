import type { FastifyRequest, FastifyReply } from "fastify";
import { generateAPIKey, generateSecretKey } from "./authService.js";

export const registerUser = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  return { apiKey: generateAPIKey(), secretKey: generateSecretKey() };
};
