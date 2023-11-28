import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({
      error: "User must be logged in",
    });
  }
  switch (req.method) {
    case "GET":
      const { data: prompts, error } = await supabase
        .from("prompts")
        .select()
        .eq("user_email", session.user?.email)
        .eq("submission_date", new Date().toISOString());
      if (error) {
        return res.status(500).json({
          error: error.message,
        });
      }
      return res.status(200).json({
        prompts,
      });
    case "POST":
      const promptAdded = await supabase
        .from("prompts")
        .insert({
          user_email: session.user?.email,
          prompt: req.body.message,
          submission_date: new Date().toISOString(),
        })
        .select();
      if (promptAdded.error) {
        return res.status(500).json({
          error: promptAdded.error.message,
        });
      }
      return res.status(200).json({
        promptAdded: promptAdded.data,
      });
    default:
      return res.status(404).json({
        message: `HTTP Method ${req.method} not supported in endpoint /api/supabase/prompts`,
      });
  }
}
