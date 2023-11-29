import { Job } from "bullmq";
import { EvoAgentJobData } from "./EvoAgentJobData";
import { evoAgentQueue } from "./evoAgentQueue";
import { Result, ResultErr, ResultOk } from "@polywrap/result";

export class EvoAgentJobScheduler {
  async startJob(threadId: string): Promise<Result<Job<EvoAgentJobData>>> {
    const job = await evoAgentQueue.add("evoAgentJob", {
      threadId,
      shouldStop: false,
    });

    return ResultOk(job);
  }

  async getJobData(jobId: string): Promise<Result<EvoAgentJobData>> {
    const job = await evoAgentQueue.getJob(jobId);

    if (!job) {
      return ResultErr();
    }

    return ResultOk(job.data);
  }

  async updateJobData(
    jobId: string,
    update: (data: EvoAgentJobData) => void
  ): Promise<Result<undefined>> {
    const job = await evoAgentQueue.getJob(jobId);

    if (!job) {
      return ResultErr();
    }

    update(job.data);

    await job.updateData(job.data);

    return ResultOk(undefined);
  }
}

export const evoAgentJobScheduler = new EvoAgentJobScheduler();
