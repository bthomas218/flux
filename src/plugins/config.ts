import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { cfg } from "../config/cfg.js";

declare module "fastify" {
  interface FastifyInstance {
    cfg: typeof cfg;
  }
}

async function configPlugin(app: FastifyInstance) {
  app.decorate("cfg", cfg);
}

export default fp(configPlugin, {
  name: "config",
});
