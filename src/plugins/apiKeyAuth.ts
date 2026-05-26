import type {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
} from "fastify";
import { UnauthorizedError } from "../errors.js";
import { prisma } from "../lib/prisma.js";
import { verifyHash } from "../lib/crypto.js";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    apiKeyAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    apiKey?: {
      userId: string;
    };
  }
}

async function apiKeyAuth(app: FastifyInstance, opts: FastifyPluginOptions) {
  app.decorateRequest("apiKey", undefined);

  app.decorate("apiKeyAuth", async (request: FastifyRequest) => {
    const apiKey = request.headers["x-api-key"];
    if (!apiKey || typeof apiKey !== "string") {
      console.log("Missing API key");
      throw new UnauthorizedError("Invalid or Missing API key");
    }

    const prefix = apiKey.slice(0, 16);
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        prefix,
        revokedAt: null,
      },
    });

    if (!apiKeyRecord) {
      console.log("API key not found or revoked");
      throw new UnauthorizedError("Invalid or Missing API key");
    }

    const { apiKeyHash, userId, id } = apiKeyRecord;

    if (!(await verifyHash(apiKey, apiKeyHash))) {
      console.log("Invalid API key hash");
      throw new UnauthorizedError("Invalid or Missing API key");
    }

    await prisma.apiKey.update({
      where: {
        id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });

    request.apiKey = {
      userId: userId,
    };
  });
}

export default fp(apiKeyAuth);
