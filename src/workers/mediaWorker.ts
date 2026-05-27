import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { prisma } from "../lib/prisma.js";
const connection = new Redis({ maxRetriesPerRequest: null });
import type { JobRecord } from "../modules/jobs/jobsService.js";

// Spoof job for now
const mediaWorker = new Worker<JobRecord>(
  "media",
  async (job) => {
    console.log("Processing job:", job.id, job.data);

    await prisma.job.update({
      where: {
        id: job.data.id,
      },
      data: {
        status: "IN_PROGRESS",
      },
    });

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 10000));

    await prisma.job.update({
      where: {
        id: job.data.id,
      },
      data: {
        status: "COMPLETED",
      },
    });

    console.log("Job completed:", job.id);
  },
  { connection },
);
