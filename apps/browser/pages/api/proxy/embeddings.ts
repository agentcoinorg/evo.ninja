import type { NextApiRequest, NextApiResponse } from "next";
import OpenAIApi from "openai";
import { authOptions } from "../auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { supabase } from "../prompt/create";

export const LLM_REQUESTS_CAP = 50;

export const api = new OpenAIApi({
  apiKey: process.env.OPENAI_API_KEY,
});

export const validGoal = async (goalId: string) => {
  if (!goalId) {
    return false
  }

  const lastPrompt = await supabase
    .from("prompts")
    .select()
    .eq("id", goalId)
    .single();

  if (lastPrompt.error) {
    console.log("Error fetching prompt: ", lastPrompt.error);
    return false;
  }

  if (!lastPrompt.data.user_email) {
    console.log("Goal without user is not valid");
    return false;
  }

  if (lastPrompt.data.llm_requests >= LLM_REQUESTS_CAP) {
    console.log("LLM requests limit achieved");
    return false;
  }

  const updatePrompt = await supabase
    .from("prompts")
    .update({ llm_requests: lastPrompt.data.llm_requests + 1 })
    .eq("id", lastPrompt.data.id);

  if (lastPrompt.error) {
    console.log(
      "Error updating last prompt llm requests: ",
      updatePrompt.error
    );
    return false;
  }

  return true;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(req.method === "POST")) {
    return res.status(404).send({});
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).send({});
  }
  const isValid = await validGoal(req.body.goalId);
  if (!isValid) {
    return res.status(403).send({});
  }
  const input: string[][] = req.body.input;
  try {
    const embeddings = await Promise.all(
      input.map(async (inputs) => {
        const { data } = await api.embeddings.create({
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
