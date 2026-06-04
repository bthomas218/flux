import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { cfg, type Cfg } from "../config/cfg.js";

declare module "fastify" {
  interface FastifyInstance {
    cfg: Cfg;
  }
}

async function configPlugin(app: FastifyInstance) {
  app.decorate("cfg", cfg);
}

export default fp(configPlugin, {
  name: "config",
});
