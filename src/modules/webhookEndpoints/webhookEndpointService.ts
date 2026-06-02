import { randomBytes } from "crypto";
import { NotFoundError } from "../../errors.js";
import { encrypt, generateSecretKey } from "../../lib/crypto.js";
import { prisma } from "../../lib/prisma.js";
import { cfg } from "../../cfg.js";

export async function createWebhookEndpoint(userId: string, url: string) {
  const secretKey = generateSecretKey();

  const { iv, tag, content } = await encrypt(
    cfg.ENCRYPTION_KEY,
    randomBytes(12).toString("hex"),
    secretKey,
  );

  const webhookEndpoint = await prisma.webhookEndpoint.create({
    data: {
      userId,
      url,
      secret: `${iv}:${content}:${tag}`,
    },
    select: {
      id: true,
      url: true,
      createdAt: true,
    },
  });

  return {
    ...webhookEndpoint,
    secret: secretKey,
  };
}

export async function listWebhookEndpoints(userId: string) {
  return prisma.webhookEndpoint.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      url: true,
      createdAt: true,
    },
  });
}

export async function deleteWebhookEndpoint(userId: string, id: string) {
  const result = await prisma.webhookEndpoint.deleteMany({
    where: {
      id,
      userId,
    },
  });

  if (result.count === 0) {
    throw new NotFoundError("Webhook endpoint not found");
  }

  return {
    success: true,
  };
}
