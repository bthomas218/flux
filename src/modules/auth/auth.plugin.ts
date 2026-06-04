import fp from "fastify-plugin";
import { AuthService } from "./auth.service.js";
import { authRoutes } from "./auth.routes.js";

declare module "fastify" {
  interface FastifyInstance {
    authService: AuthService;
  }
}

export default fp(
  async function authPlugin(fastify) {
    const authService = new AuthService(fastify.prisma, fastify.cfg);

    fastify.decorate("authService", authService);

    fastify.register(authRoutes, { prefix: "auth" });
  },
  {
    name: "auth",
    dependencies: ["prisma", "config"],
  },
);
