import { NotFoundError } from "../../errors.js";
import { generateAPIKey, toHash } from "../../lib/crypto.js";
import { prisma } from "../../lib/prisma.js";

export async function createApiKey(userId: string, name: string) {
  const apiKey = generateAPIKey();
  const apiKeyHash = await toHash(apiKey);

  const record = await prisma.apiKey.create({
    data: {
      userId,
      name,
      apiKeyHash,
      prefix: apiKey.slice(0, 16),
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });

  return {
    ...record,
    apiKey,
  };
}

export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });
}

export async function revokeApiKey(userId: string, id: string) {
  const result = await prisma.apiKey.updateMany({
    where: {
      id,
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  if (result.count === 0) {
    throw new NotFoundError("API key not found");
  }

  return {
    success: true,
  };
}
