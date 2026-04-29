import {
  generateAPIKey,
  generateSecretKey,
  hashKey,
} from "../../lib/crypto.js";
import { prisma } from "../../lib/prisma.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { ConflictError } from "../../errors.js";

export async function createUser(email: string, keyName: string | undefined) {
  try {
    const apiKey = generateAPIKey();
    const secretKey = generateSecretKey();

    await prisma.user.create({
      data: {
        email: email,
        webhookSecret: await hashKey(secretKey),
        apiKeys: {
          create: {
            apiKeyHash: await hashKey(apiKey),
            name: keyName ?? `sk_${email}`,
            revokedAt: null,
            lastUsedAt: null,
          },
        },
      },
    });

    return { apiKey, secretKey };
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        throw new ConflictError("User already exists");
      }
    }
    throw err;
  }
}
