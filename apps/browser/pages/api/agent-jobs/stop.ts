import type { NextApiRequest, NextApiResponse } from "next";
import { evoAgentJobScheduler } from "../../../src/evo-agent-job/EvoAgentJobScheduler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(404);
  }

  const jobId = req.query.jobId as string;
  console.log("Killing job: " + jobId);

  const result = await evoAgentJobScheduler.updateJobData(
    jobId,
    (data) => (data.shouldStop = true)
  );

  if (!result.ok) {
    return res.status(500).json({});
  }

  return res.status(200).json({});
}
