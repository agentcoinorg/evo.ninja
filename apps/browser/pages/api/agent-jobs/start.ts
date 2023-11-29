import type { NextApiRequest, NextApiResponse } from "next";
import { evoAgentJobScheduler } from "../../../src/evo-agent-job/EvoAgentJobScheduler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(404);
  }

  const threadId = req.query.threadId as string;

  console.log("Adding job to the queue: " + threadId);

  const result = await evoAgentJobScheduler.startJob(threadId);

  if (!result.ok) {
    return res.status(500).json({
      error: "Failed to add job to the queue",
    });
  }

  return res.status(200).json({
    jobId: result.value.id,
  });
}
