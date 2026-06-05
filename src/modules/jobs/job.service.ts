import type { Queue } from "bullmq";
import { NotFoundError } from "../../errors.js";
import type {
  Prisma,
  PrismaClient,
} from "../../lib/generated/prisma/client.js";
import type { FileMetadataService } from "../files/file-metadata.service.js";
import type { FileStorageService } from "../files/file-storage.service.js";
import type { JobStatus, JobType } from "../../lib/generated/prisma/enums.js";
import type {
  CreateJobBody,
  CreateJobReply,
  GetJobReply,
  ListJobsReply,
} from "./job.schemas.js";
import type {
  ImageJobNames,
  ImageJobPayload,
  ImageResultPayLoad,
} from "./types.js";
import { MAX_JOB_RETRY_ATTEMPTS } from "./job.queue.js";

export type JobRecord = {
  id: string;
  fileId: string;
  outputFileId: string | null;
  type: JobType;
  status: JobStatus;
  data: Prisma.JsonValue;
};

function toJobResponse(job: JobRecord): CreateJobReply {
  return {
    jobId: job.id,
    fileId: job.fileId,
    outputFileId: job.outputFileId,
    jobType:
      job.type === "IMAGE_TRANSCODE"
        ? "image.transcode"
        : job.type === "IMAGE_ALTTEXT"
          ? "image.alttext"
          : "image.resize",
    status:
      job.status === "PENDING"
        ? "pending"
        : job.status === "IN_PROGRESS"
          ? "in_progress"
          : job.status === "COMPLETED"
            ? "completed"
            : "failed",
    options: job.data as CreateJobBody["options"],
  };
}

export class JobService {
  constructor(
    private prisma: PrismaClient,
    private fileMetaDataService: FileMetadataService,
    private fileStorageService: FileStorageService,
    private jobQueue: Queue<ImageJobPayload, ImageResultPayLoad, ImageJobNames>,
  ) {}

  async create(
    userId: string,
    jobData: CreateJobBody,
  ): Promise<CreateJobReply> {
    const job = await this.prisma.$transaction(async (tx) => {
      const file = await tx.file.findFirst({
        where: {
          id: jobData.fileId,
          userId,
          deletedAt: null,
        },
      });

      if (!file) {
        throw new NotFoundError("File not found");
      }

      return tx.job.create({
        data: {
          userId,
          fileId: file.id,
          status: "PENDING",
          type: this.toDbJobType(jobData.type),
          data: jobData.options as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          fileId: true,
          type: true,
          status: true,
          data: true,
          outputFileId: true,
        },
      });
    });

    await this.enqueueJob(job.id, {
      ...jobData,
      fileId: job.fileId,
      userId,
    });

    return toJobResponse(job);
  }

  async findOne(id: string, userId: string): Promise<GetJobReply> {
    const job = await this.prisma.job.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        fileId: true,
        type: true,
        status: true,
        data: true,
        outputFileId: true,
      },
    });

    if (!job) {
      throw new NotFoundError("Job not found");
    }

    return toJobResponse(job);
  }

  async findMany(userId: string): Promise<ListJobsReply> {
    const jobs = await this.prisma.job.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fileId: true,
        outputFileId: true,
        type: true,
        status: true,
        data: true,
      },
    });

    return jobs.map(toJobResponse);
  }

  async updateStatus(id: string, status: JobStatus, newFileId?: string) {
    const now = new Date();

    const data: {
      status: JobStatus;
      outputFileId?: string;
      startedAt?: Date;
      finishedAt?: Date;
    } = {
      status,
    };

    if (status === "IN_PROGRESS") {
      data.startedAt = now;
    } else if (status === "COMPLETED") {
      data.finishedAt = now;
      data.outputFileId = newFileId;
    } else if (status === "FAILED") {
      data.finishedAt = now;
    }

    await this.prisma.job.update({
      where: {
        id,
      },
      data,
    });
  }

  async enqueueJob(id: string, payload: ImageJobPayload) {
    await this.jobQueue.add(payload.type, payload, {
      jobId: id,
      attempts: MAX_JOB_RETRY_ATTEMPTS,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    });
  }

  private toDbJobType(type: CreateJobBody["type"]): JobType {
    return type === "image.alttext"
      ? "IMAGE_ALTTEXT"
      : type === "image.transcode"
        ? "IMAGE_TRANSCODE"
        : "IMAGE_RESIZE";
  }
}

export function createJobService(
  prisma: PrismaClient,
  fileMetaDataService: FileMetadataService,
  fileStorageService: FileStorageService,
  jobQueue: Queue<ImageJobPayload, ImageResultPayLoad, ImageJobNames>,
) {
  return new JobService(
    prisma,
    fileMetaDataService,
    fileStorageService,
    jobQueue,
  );
}
