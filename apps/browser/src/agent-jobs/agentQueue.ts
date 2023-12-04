import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import { runAgentJob } from "./runAgentJob";
import { AgentJobData } from "./AgentJobData";

const connection = new Redis(process.env.REDIS_URL!);

export const agentQueue = new Queue("agentQueue", {
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
  "agentQueueWorker",
  async (job) => {
    if (!job || !job.id) {
      console.log("Job not found");
      return;
    }

    const data: AgentJobData = job.data;
    console.log(data);

    await runAgentJob(job.id, data);
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  }
);
