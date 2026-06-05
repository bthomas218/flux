import fp from "fastify-plugin";
import { ApiKeyService } from "./api-key.service.js";
import { apiKeyRoutes } from "./api-key.routes.js";

declare module "fastify" {
  interface FastifyInstance {
    apiKeyService: ApiKeyService;
  }
}

export default fp(
  async function apiKeyPlugin(fastify) {
    const apiKeyService = new ApiKeyService(fastify.prisma);

    fastify.decorate("apiKeyService", apiKeyService);

    fastify.register(apiKeyRoutes, { prefix: "api-keys" });
  },
  {
    name: "apiKey",
    dependencies: ["prisma"],
  },
);
