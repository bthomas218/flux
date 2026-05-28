import { randomUUID } from "node:crypto";
import { NotFoundError } from "../../errors.js";
import type { JobStatus, JobType } from "../../lib/generated/prisma/enums.js";
import type { Prisma } from "../../lib/generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateJobBody,
  CreateJobReply,
  GetJobReply,
  ListJobsReply,
} from "./jobsSchemas.js";
import { mediaQueue } from "../../queues/mediaQueue.js";

export type JobRecord = {
  id: string;
  fileId: string;
  type: JobType;
  status: JobStatus;
  data: Prisma.JsonValue;
};

function toJobResponse(job: JobRecord): CreateJobReply {
  return {
    jobId: job.id,
    fileId: job.fileId,
    jobType:
      job.type == "IMAGE_TRANSCODE"
        ? "image.transcode"
        : job.type == "IMAGE_ALTTEXT"
          ? "image.alttext"
          : "image.resize",
    status:
      job.status == "PENDING"
        ? "pending"
        : job.status == "IN_PROGRESS"
          ? "in_progress"
          : job.status == "COMPLETED"
            ? "completed"
            : "failed",
    options: job.data as CreateJobBody["options"],
  };
}

export async function createJob(
  userId: string,
  jobData: CreateJobBody,
): Promise<CreateJobReply> {
  const placeholderId = randomUUID();

  const job = await prisma.$transaction(async (tx) => {
    const file = await tx.file.create({
      data: {
        userId,
        storageKey: `placeholder/${placeholderId}`,
        filename: "placeholder",
        mimeType: "application/octet-stream",
        size: 0,
        url: `placeholder://${placeholderId}`,
      },
    });

    return tx.job.create({
      data: {
        userId,
        fileId: file.id,
        status: "PENDING",
        type:
          jobData.type == "image.alttext"
            ? "IMAGE_ALTTEXT"
            : jobData.type == "image.transcode"
              ? "IMAGE_TRANSCODE"
              : "IMAGE_RESIZE",
        data: jobData.options as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        fileId: true,
        type: true,
        status: true,
        data: true,
      },
    });
  });

  const queuePayload: CreateJobBody = {
    ...jobData,
    fileId: job.fileId,
  };

  await mediaQueue.add(jobData.type, queuePayload, {
    jobId: job.id,
  });

  return toJobResponse(job);
}

export async function getJob(
  userId: string,
  jobId: string,
): Promise<GetJobReply> {
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId,
    },
    select: {
      id: true,
      fileId: true,
      type: true,
      status: true,
      data: true,
    },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  return toJobResponse(job);
}

export async function listJobs(userId: string): Promise<ListJobsReply> {
  const jobs = await prisma.job.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      fileId: true,
      type: true,
      status: true,
      data: true,
    },
  });

  return jobs.map(toJobResponse);
}
