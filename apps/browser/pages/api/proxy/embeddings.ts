import type { NextApiRequest, NextApiResponse } from "next";
import OpenAIApi from "openai";
import { createSupabaseServerClient } from "../../../src/supabase/createServerClient";

export const api = new OpenAIApi({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const supabase = createSupabaseServerClient();
    const session = await supabase.auth.getSession()
    if (session) {
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

        return res.status(500).json({
          error: "Unknown error thrown from OpenAI: " + e.message,
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
