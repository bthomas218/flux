import type { FastifyReply, FastifyRequest } from "fastify";
import { createJob, getJob, listJobs } from "./jobsService.js";
import type {
  CreateJobBody,
  CreateJobReply,
  GetJobParams,
  GetJobReply,
} from "./jobsSchemas.js";

// TODO: Implement the actual logic for creating and retrieving jobs in the service layer

export const createJobHandler = async (
  request: FastifyRequest<{ Body: CreateJobBody }>,
  reply: FastifyReply<{ Reply: CreateJobReply }>,
) => {
  const { jobType, data } = request.body;
  const userId = request.apiKey!.userId;

  const job = await createJob(userId, jobType, data);

  reply.send({
    jobId: job.jobId,
    jobType: job.jobType,
    status: job.status,
    data: job.data,
  });
};

export const getJobHandler = async (
  request: FastifyRequest<{ Params: GetJobParams }>,
  reply: FastifyReply<{ Reply: GetJobReply }>,
) => {
  const { id } = request.params;
  const userId = request.apiKey!.userId;

  const job = await getJob(userId, id);

  reply.send({
    jobId: job.jobId,
    jobType: job.jobType,
    status: job.status,
    data: job.data,
  });
};

export const listJobsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply<{ Reply: GetJobReply[] }>,
) => {
  const userId = request.apiKey!.userId;

  const jobs = await listJobs(userId);
  reply.send(
    jobs.map((job) => ({
      jobId: job.jobId,
      jobType: job.jobType,
      status: job.status,
      data: job.data,
    })),
  );
};
