import { randomBytes } from "node:crypto";
import type { Queue } from "bullmq";
import type { Cfg } from "../../config/cfg.js";
import { NotFoundError } from "../../errors.js";
import type { PrismaClient } from "../../lib/generated/prisma/client.js";
import { decrypt, encrypt, generateSecretKey } from "../../lib/crypto.js";
import type { WebhookJobNames, WebhookJobPayload } from "./types.js";

export class WebhookService {
  constructor(
    private prisma: PrismaClient,
    private webHookQueue: Queue<WebhookJobPayload, void, WebhookJobNames>,
    private config: Pick<Cfg, "ENCRYPTION_KEY">,
  ) {}

  async create(userId: string, url: string) {
    const secretKey = generateSecretKey();

    const { iv, tag, content } = await encrypt(
      this.config.ENCRYPTION_KEY,
      randomBytes(12).toString("hex"),
      secretKey,
    );

    const webhookEndpoint = await this.prisma.webhookEndpoint.create({
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

  async findOne(id: string, userId: string) {
    const webhookEndpoint = await this.prisma.webhookEndpoint.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        url: true,
        createdAt: true,
      },
    });

    if (!webhookEndpoint) {
      throw new NotFoundError("Webhook endpoint not found");
    }

    return webhookEndpoint;
  }

  async findMany(userId: string) {
    return this.prisma.webhookEndpoint.findMany({
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

  async delete(id: string, userId: string) {
    const result = await this.prisma.webhookEndpoint.deleteMany({
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

  async update(id: string, userId: string, url: string) {
    const result = await this.prisma.webhookEndpoint.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        url,
      },
    });

    if (result.count === 0) {
      throw new NotFoundError("Webhook endpoint not found");
    }

    return this.findOne(id, userId);
  }

  async sendWebhookNotification(
    jobId: string,
    userId: string,
    status: "COMPLETED" | "FAILED",
    webhookEndpointId: string,
    jobType: string,
    result?: {
      fileId?: string;
      width?: number;
      height?: number;
      mimeType?: string;
      altText?: string;
    },
    errorMessage?: string,
  ) {
    const payload =
      status === "COMPLETED"
        ? {
            event: "job.completed",
            type: jobType,
            jobId,
            userId,
            webHookEndpointId: webhookEndpointId,
            status,
            result,
          }
        : {
            event: "job.failed",
            type: jobType,
            jobId,
            userId,
            webHookEndpointId: webhookEndpointId,
            status,
            error: {
              message: errorMessage || "Unknown error",
            },
          };

    await this.webHookQueue.add(
      status === "COMPLETED" ? "job.completed" : "job.failed",
      payload as WebhookJobPayload,
    );
  }

  async deliverWebhook(payload: WebhookJobPayload) {
    const webhookEndpoint = await this.prisma.webhookEndpoint.findUnique({
      where: {
        id: payload.webHookEndpointId,
      },
      select: {
        secret: true,
        url: true,
      },
    });

    if (!webhookEndpoint) {
      console.log(
        `Webhook endpoint not found for id ${payload.webHookEndpointId}`,
      );
      throw new Error("Webhook endpoint not found");
    }

    const [iv, data, tag] = webhookEndpoint.secret.split(":");

    if (!iv || !data || !tag) {
      console.log(`Invalid webhook secret for user ${payload.userId}`);
      throw new Error("Invalid webhook secret for user");
    }

    const webhookSecret = await decrypt(
      this.config.ENCRYPTION_KEY,
      iv,
      data,
      tag,
    );

    const res = await this.sendWebhookPayload(
      webhookEndpoint.url,
      webhookSecret,
      payload,
    );

    if (!res.ok) {
      throw new Error(`Webhook failed with ${res.status}`);
    }
  }

  private async sendWebhookPayload(
    url: string,
    webhookSecret: string,
    payload: WebhookJobPayload,
  ) {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": webhookSecret,
      },
      body: JSON.stringify(payload),
    });
  }
}

export function createWebhookService(
  prisma: PrismaClient,
  webhookQueue: Queue<WebhookJobPayload, void, WebhookJobNames>,
  config: Pick<Cfg, "ENCRYPTION_KEY">,
) {
  return new WebhookService(prisma, webhookQueue, config);
}
