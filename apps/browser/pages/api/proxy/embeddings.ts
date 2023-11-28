import type { NextApiRequest, NextApiResponse } from "next";
import OpenAIApi from "openai";
import { authOptions } from "../auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { isGoalValid } from "../../../api-utils/goal";
import { canUseSubsidy } from "../../../api-utils/subsidy";
import { createSupabaseClient } from "../../../api-utils/supabase";
import { createOpenAIApiClient } from "../../../api-utils/openai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (!(req.method === "POST")) {
    return res.status(404).send({});
  }
  const goalId = req.body.goalId;

  // Ensure the user is logged in
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!session || !email) {
    return res.status(401).send({});
  }

  const supabase = createSupabaseClient();
  const openai = createOpenAIApiClient();

  // Ensure the goal is being tracked, and we're able to continue
  // subsidizing the goal's llm requests
  const isValid = await isGoalValid(goalId, supabase);
  if (!isValid) {
    return res.status(403).send({});
  }
  const canSubsidize = await canUseSubsidy("embedding", goalId, supabase);
  if (!canSubsidize) {
    return res.status(403).send({});
  }

  const input: string[][] = req.body.input;
  try {
    const embeddings = await Promise.all(
      input.map(async (inputs) => {
        const { data } = await openai.embeddings.create({
          model: req.body.model,
          input: inputs,
        });

        return data.map((innerData) => {
          return {
            embedding: innerData.embedding,
            input: inputs[innerData.index],
          };
        });
      })
    );
    return res.status(200).json({ embeddings: embeddings.flat() });
  } catch (e: any) {
    // Rate limit error
    if (e instanceof OpenAIApi.APIError && e.status === 429) {
      return res.status(429).send({});
    }
    return res.status(500).send({});
  }
}
