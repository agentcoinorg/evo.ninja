import type { NextApiRequest, NextApiResponse } from "next";
import { searchOnGoogle } from "@evo-ninja/agents";

type ResponseData = {
  googleResults: {
    title: string;
    url: string;
    description: string;
    trustedSource: boolean;
  }[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const results = await searchOnGoogle(req.query.query as string, req.query.apiKey as string);
  res.status(200).json({ googleResults: results });
}
