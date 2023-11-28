import type { NextApiRequest, NextApiResponse } from "next";
import { EvoGoalJobData, evoGoalQueue } from "./evoGoalQueue";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(404);
  }
  console.log("Adding job to the queue");

  const data: EvoGoalJobData = {
    goal: "This is a sample goal",
  };
  await evoGoalQueue.add("evoGoalJob", data);

  return res.status(200).json({ status: "Job added to the queue" });
}
