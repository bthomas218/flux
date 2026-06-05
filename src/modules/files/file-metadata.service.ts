import { ConflictError, NotFoundError } from "../../errors.js";
import type { PrismaClient } from "../../lib/generated/prisma/client.js";
import type { FileUncheckedCreateInput } from "../../lib/generated/prisma/models.js";

export class FileMetadataService {
  constructor(private prisma: PrismaClient) {}

  async findOne(id: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!file) {
      throw new NotFoundError("File not found");
    }

    return file;
  }

  async findMany(userId: string) {
    return this.prisma.file.findMany({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }

  async create(fileMetaData: FileUncheckedCreateInput) {
    return this.prisma.file.create({
      data: fileMetaData,
    });
  }

  async ensureNotInUse(id: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        fileId: id,
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
        finishedAt: null,
      },
    });

    if (job) {
      throw new ConflictError("File is currently in use");
    }
  }

  async markDeleted(id: string) {
    return this.prisma.file.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
