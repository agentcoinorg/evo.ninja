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
    goal: "What is tesla's revenue 2022?",
  };
  await evoGoalQueue.add("evoGoalJob", data);

  return res.status(200).json({});
}
