import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import { runEvoForGoal } from "./runEvoForGoal";
const connection = new Redis(process.env.REDIS_URL!);

export const evoGoalQueue = new Queue("evoGoalQueue", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export type EvoGoalJobData = {
  goal: string;
};

const worker = new Worker(
  "evoGoalQueue",
  async (job) => {
    const data: EvoGoalJobData = job?.data;
    console.log(data);

    await runEvoForGoal(data.goal);
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  }
);
