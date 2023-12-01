import type { NextApiRequest, NextApiResponse } from "next";
import { processWebpage } from "@evo-ninja/agents";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await processWebpage(req.query.url as string);
    return res.status(200).json({ text: result });
  } catch (error) {
    console.error(error);
    return res.status(500).send({});
  }
}
