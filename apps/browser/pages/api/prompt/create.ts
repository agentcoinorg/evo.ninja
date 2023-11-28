import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const PROMPTS_CAP = 5;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "User must be logged in" });
  }
  if (req.method === "POST") {
    const { data: prompts, error } = await supabase
      .from("prompts")
      .select()
      .eq("user_email", session.user?.email)
      .eq("submission_date", new Date().toISOString());

    if (error) {
      return res.status(500);
    }

    if (prompts?.length && prompts.length >= PROMPTS_CAP) {
      return res.status(403).json({ message: "Prompts cap reached" });
    } else {
      const promptAdded = await supabase
        .from("prompts")
        .insert({
          user_email: session.user?.email,
          prompt: req.body.message,
          submission_date: new Date().toISOString(),
        })
        .select()
        .single();
      if (promptAdded.error) {
        return res.status(500).json({
          error: promptAdded.error.message,
        });
      }
      return res.status(200).json({
        promptAdded: promptAdded.data,
      });
    }
  } else {
    return res.status(404);
  }
}
