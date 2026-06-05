import { Queue } from "bullmq";
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import type { WebhookJobNames, WebhookJobPayload } from "./types.js";
import { webhookRoutes } from "./webhook.routes.js";
import { createWebhookService, WebhookService } from "./webhook.service.js";
import { createWebhookQueue } from "./webhook.queue.js";

declare module "fastify" {
  interface FastifyInstance {
    webhookQueue: Queue<WebhookJobPayload, void, WebhookJobNames>;
    webhookService: WebhookService;
  }
}

export default fp(
  async function webhookPlugin(fastify) {
    const connection = fastify.redis;
    const webhookQueue = createWebhookQueue(connection);
    const webhookService = createWebhookService(
      fastify.prisma,
      webhookQueue,
      fastify.cfg,
    );

    fastify.decorate("webhookQueue", webhookQueue);
    fastify.decorate("webhookService", webhookService);

    fastify.addHook("onClose", async () => {
      await webhookQueue.close();
    });

    fastify.register(webhookRoutes, { prefix: "webhooks" });
  },
  {
    name: "webhook",
    dependencies: ["redis", "prisma", "config"],
  },
);
