import type { Cfg } from "../../config/cfg.js";
import type { PrismaClient } from "../../lib/generated/prisma/client.js";
import { UnauthorizedError } from "../../errors.js";
import { generateToken, toDeterministicHash } from "../../lib/crypto.js";

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private config: Cfg,
  ) {}

  async sendMagicLink(email: string) {
    const token = generateToken();
    const tokenHash = toDeterministicHash(token, this.config.TOKEN_HASH_SECRET);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const url = `http://${this.config.HOSTNAME}:${this.config.PORT}/auth/callback?token=${token}`;

    await this.prisma.magicLinkToken.create({
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

  async verifyMagicLinkToken(token: string) {
    const candidateHash = toDeterministicHash(
      token,
      this.config.TOKEN_HASH_SECRET,
    );

    const record = await this.prisma.magicLinkToken.findFirst({
      where: {
        tokenHash: candidateHash,
      },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedError("Invalid or expired magic link token");
    }

    let user = await this.prisma.user.findUnique({
      where: {
        email: record.email,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: record.email,
        },
      });
    }

    await this.prisma.magicLinkToken.deleteMany({
      where: {
        email: record.email,
      },
    });

    return user;
  }
}
