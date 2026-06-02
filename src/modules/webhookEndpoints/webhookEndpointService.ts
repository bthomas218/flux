import { randomUUID } from "node:crypto";
import { NotFoundError } from "../../errors.js";
import { prisma } from "../../lib/prisma.js";

type WebhookEndpointRecord = {
  id: string;
  url: string;
  createdAt: Date;
};

export async function createWebhookEndpoint(userId: string, url: string) {
  const id = randomUUID();
  const [record] = await prisma.$queryRaw<WebhookEndpointRecord[]>`
    INSERT INTO "WebhookEndpoint" ("id", "userId", "url")
    VALUES (${id}, ${userId}, ${url})
    RETURNING "id", "url", "createdAt"
  `;

  if (!record) {
    throw new Error("Unable to create webhook endpoint");
  }

  return record;
}

export async function listWebhookEndpoints(userId: string) {
  return prisma.$queryRaw<WebhookEndpointRecord[]>`
    SELECT "id", "url", "createdAt"
    FROM "WebhookEndpoint"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
  `;
}

export async function deleteWebhookEndpoint(userId: string, id: string) {
  const result = await prisma.$queryRaw<{ id: string }[]>`
    DELETE FROM "WebhookEndpoint"
    WHERE "id" = ${id} AND "userId" = ${userId}
    RETURNING "id"
  `;

  if (result.length === 0) {
    throw new NotFoundError("Webhook endpoint not found");
  }

  return {
    success: true,
  };
}
