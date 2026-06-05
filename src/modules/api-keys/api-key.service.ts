import type { PrismaClient } from "../../lib/generated/prisma/client.js";
import { NotFoundError } from "../../errors.js";
import { generateAPIKey, toHash } from "../../lib/crypto.js";

export class ApiKeyService {
  constructor(private prisma: PrismaClient) {}

  private metadataSelect = {
    id: true,
    name: true,
    prefix: true,
    lastUsedAt: true,
    revokedAt: true,
    createdAt: true,
  } as const;

  async create(userId: string, name: string) {
    const apiKey = generateAPIKey();
    const apiKeyHash = await toHash(apiKey);

    const record = await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        apiKeyHash,
        prefix: apiKey.slice(0, 16),
      },
      select: this.metadataSelect,
    });

    return {
      ...record,
      apiKey,
    };
  }

  async findMany(userId: string) {
    return this.prisma.apiKey.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: this.metadataSelect,
    });
  }

  async findOne(id: string, userId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id,
        userId,
        revokedAt: null,
      },
      select: this.metadataSelect,
    });

    if (!apiKey) {
      throw new NotFoundError("API key not found");
    }

    return apiKey;
  }

  async update(id: string, userId: string, name: string) {
    const result = await this.prisma.apiKey.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        name,
      },
    });

    if (result.count === 0) {
      throw new NotFoundError("API key not found");
    }

    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string) {
    const result = await this.prisma.apiKey.updateMany({
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
}
