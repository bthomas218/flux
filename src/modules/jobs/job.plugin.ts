import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { createJobService, type JobService } from "./job.service.js";
import type { Queue } from "bullmq";
import type {
  ImageJobPayload,
  ImageJobNames,
  ImageResultPayLoad,
} from "./types.js";
import { createJobQueue } from "./job.queue.js";
import { jobRoutes } from "./job.routes.js";

declare module "fastify" {
  interface FastifyInstance {
    jobService: JobService;
    jobQueue: Queue<ImageJobPayload, ImageResultPayLoad, ImageJobNames>;
  }
}

export default fp(async function jobPlugin(fastify) {
  const jobQueue = createJobQueue(fastify.redis);
  const jobService = createJobService(
    fastify.prisma,
    fastify.fileMetaDataService,
    fastify.fileStorageService,
    jobQueue,
  );

  fastify.decorate("jobService", jobService);
  fastify.decorate("jobQueue", jobQueue);

  fastify.addHook("onClose", async () => {
    await jobQueue.close();
  });

  fastify.register(jobRoutes, { prefix: "jobs" });
}, {
  name: "jobs",
  dependencies: ["prisma", "redis", "files"],
});
