import {
  generateAPIKey,
  generateSecretKey,
  toHash,
  encrypt,
  generateToken,
} from "../../lib/crypto.js";
import { prisma } from "../../lib/prisma.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { ConflictError } from "../../errors.js";
import { cfg } from "../../cfg.js";
import { randomBytes } from "node:crypto";
import { success } from "zod";

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
            apiKeyHash: await toHash(apiKey),
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

export async function sendMagicLink(email: string) {
  const token = generateToken();
  const tokenHash = toHash(token);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  const url = `http://${cfg.HOSTNAME}:${cfg.PORT}/auth/callback?token=${token}`;

  // plug in sending an email later

  return {
    token,
    callbackUrl: url,
    success: true,
  };
}
