import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import { runEvoAgentJob } from "./runEvoAgentJob";
import { EvoAgentJobData } from "./EvoAgentJobData";

const connection = new Redis(process.env.REDIS_URL!);

export const evoAgentQueue = new Queue("evoAgentQueue", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

const worker = new Worker(
  "evoAgentQueueWorker",
  async (job) => {
    if (!job || !job.id) {
      console.log("Job not found");
      return;
    }

    const data: EvoAgentJobData = job.data;
    console.log(data);

    await runEvoAgentJob(job.id, data);
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  }
);
