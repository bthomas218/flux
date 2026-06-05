import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { createPrismaClient } from "../lib/prisma.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

async function prismaPlugin(app: FastifyInstance) {
  const connectionString = app.cfg.DATABASE_URL;
  const prisma = createPrismaClient(connectionString);

  await prisma.$connect();

  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
}

export default fp(prismaPlugin, {
  name: "prisma",
  dependencies: ["config"],
});
