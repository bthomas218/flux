import {
  generateAPIKey,
  generateSecretKey,
  hashKey,
  encrypt,
} from "../../lib/crypto.js";
import { prisma } from "../../lib/prisma.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { ConflictError } from "../../errors.js";
import { cfg } from "../../cfg.js";
import { randomBytes } from "node:crypto";

export async function createUser(email: string, keyName: string | undefined) {
  try {
    const apiKey = generateAPIKey();
    const secretKey = generateSecretKey();

    const { iv, tag, content } = await encrypt(
      cfg.ENCRYPTION_KEY,
      randomBytes(12).toString("hex"),
      secretKey,
    );

    await prisma.user.create({
      data: {
        email: email,
        webhookSecret: `${iv}:${content}:${tag}`,
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
