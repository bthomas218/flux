import type { FastifyReply, FastifyRequest } from "fastify";

export const createJobHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  reply.send({ message: "Job created successfully" });
};
