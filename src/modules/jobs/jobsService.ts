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

type JobData = CreateJobBody["data"];

export type JobRecord = {
  id: string;
  type: JobType;
  status: JobStatus;
  data: Prisma.JsonValue;
};

function toJobResponse(job: JobRecord): CreateJobReply {
  return {
    jobId: job.id,
    jobType: job.type,
    status: job.status,
    data: job.data as JobData,
  };
}

export async function createJob(
  userId: string,
  jobType: JobType,
  jobData: JobData,
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
        type: jobType,
        data: jobData as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        type: true,
        status: true,
        data: true,
      },
    });
  });

  await mediaQueue.add(job.id, {
    type: job.type,
    status: job.status,
    data: job.data as JobData,
    id: job.id,
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
      type: true,
      status: true,
      data: true,
    },
  });

  return jobs.map(toJobResponse);
}
