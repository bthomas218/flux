import { Queue } from "bullmq";
import type { JobRecord } from "../modules/jobs/jobsService.js";

export const mediaQueue = new Queue<JobRecord>("media");
