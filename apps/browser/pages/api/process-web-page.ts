import type { NextApiRequest, NextApiResponse } from "next";
import { processWebpage } from "@evo-ninja/agents";

type ResponseData = {
  text: string
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const result = await processWebpage(req.query.url as string);
    return res.status(200).json({ text: result });
  } catch (error) {
    console.error(error);
    return res.status(500).send({});
  }
}
