import { Job } from "bullmq";
import { AgentJobData } from "./AgentJobData";
import { agentQueue } from "./agentQueue";
import { Result, ResultErr, ResultOk } from "@polywrap/result";

export class AgentJobScheduler {
  async startJob(threadId: string): Promise<Result<Job<AgentJobData>>> {
    const job = await agentQueue.add("agentJob", {
      threadId,
      shouldStop: false,
    });

    return ResultOk(job);
  }

  async getJobData(jobId: string): Promise<Result<AgentJobData>> {
    const job = await agentQueue.getJob(jobId);

    if (!job) {
      return ResultErr();
    }

    return ResultOk(job.data);
  }

  async updateJobData(
    jobId: string,
    update: (data: AgentJobData) => void
  ): Promise<Result<undefined>> {
    const job = await agentQueue.getJob(jobId);

    if (!job) {
      return ResultErr();
    }

    update(job.data);

    await job.updateData(job.data);

    return ResultOk(undefined);
  }
}

export const evoAgentJobScheduler = new AgentJobScheduler();
