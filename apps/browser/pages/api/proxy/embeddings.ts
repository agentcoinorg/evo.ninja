import type { NextApiRequest, NextApiResponse } from "next";
import OpenAIApi from "openai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const api = new OpenAIApi({
      apiKey: process.env.OPENAI_API_KEY,
    });
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
      return res.status(200).json({ embeddings })
    } catch (e: any) {
      console.log(e)
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
    throw new Error(
      "Method: " + req.method + " not support for endpoint /api/proxy/embeddings"
    );
  }
}
