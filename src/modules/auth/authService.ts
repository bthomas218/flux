import { generateToken, toDeterministicHash } from "../../lib/crypto.js";
import { prisma } from "../../lib/prisma.js";
import { UnauthorizedError } from "../../errors.js";
import { cfg } from "../../cfg.js";

export async function sendMagicLink(email: string) {
  const token = generateToken();
  const tokenHash = toDeterministicHash(token, cfg.TOKEN_HASH_SECRET);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  const url = `http://${cfg.HOSTNAME}:${cfg.PORT}/auth/callback?token=${token}`;

  await prisma.magicLinkToken.create({
    data: {
      email,
      tokenHash,
      expiresAt,
    },
  });

  // plug in sending an email later

  return {
    token,
    callbackUrl: url,
    success: true,
  };
}

export async function verifyMagicLinkToken(token: string) {
  const candidateHash = toDeterministicHash(token, cfg.TOKEN_HASH_SECRET);

  const record = await prisma.magicLinkToken.findFirst({
    where: {
      tokenHash: candidateHash,
    },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid or expired magic link token");
  }

  let user = await prisma.user.findUnique({
    where: {
      email: record.email,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: record.email,
      },
    });
  }

  await prisma.magicLinkToken.deleteMany({
    where: {
      email: record.email,
    },
  });

  return user;
}
