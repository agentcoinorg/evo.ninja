import type { NextApiRequest, NextApiResponse } from "next";
import OpenAIApi from "openai";
import { authOptions } from "../auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { supabase } from "../supabase/prompts";

export const LLM_REQUESTS_CAP = 50;

export const api = new OpenAIApi({
  apiKey: process.env.OPENAI_API_KEY,
});

export const validGoal = async (goalId: string) => {
  const lastPrompt = await supabase
    .from("prompts")
    .select()
    .eq("id", goalId)
    .single();

  if (lastPrompt.error) {
    console.log("Error fetching prompt: ", lastPrompt.error);
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
  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    if (session) {
      console.log(req.body)
      const isValid = await validGoal(req.body.goalId);
      if (!isValid) {
        return res.status(403).json({
          error: "Free quota has been achieved"
        })
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
          return res.status(429).json({
            error: "Rate limit error thrown from OpenAI",
          });
        }
        console.log("Error from OpenAI: ", e.message);
        return res.status(500).json({
          error: "Unknown error",
        });
      }
    } else {
      return res.status(401).json({
        error: "User must be logged in",
      });
    }
  } else {
    return res.status(404).json({
      message: `HTTP Method ${req.method} not supported in endpoint /api/proxy/embeddings`,
    });
  }
}
