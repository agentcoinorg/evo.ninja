import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import OpenAIApi from "openai";
import { authOptions } from "../auth/[...nextauth]";
import { isGoalValid } from "../../../api-utils/goal";
import { canUseSubsidy } from "../../../api-utils/subsidy";
import { createSupabaseClient } from "../../../api-utils/supabase";
import { createOpenAIApiClient } from "../../../api-utils/openai";

// Configure the maximum # of seconds this function can run for
// https://vercel.com/docs/functions/configuring-functions/duration#node.js,-next.js-13.5-or-higher,-sveltekit,-and-remix
export const maxDuration = 45;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(req.method === "POST")) {
    return res.status(404).send({});
  }
  const goalId = req.body.goalId;

  // Ensure the user is logged in
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!session || !email) {
    return res.status(401).send({})
  }

  const supabase = createSupabaseClient();
  const openai = createOpenAIApiClient();

  // Ensure the goal is being tracked, and we're able to continue
  // subsidizing the goal's completions requests
  const isValid = await isGoalValid(goalId, supabase);
  if (!isValid) {
    console.error("IS NOT VALID", goalId, "heyooooo")
    return res.status(403).send({});
  }
  const canSubsidize = await canUseSubsidy("completions", goalId, supabase);
  if (!canSubsidize) {
    console.error("CANNOT SUBSIDIZE")
    return res.status(403).send({});
  }

  const functions = req.body.functions ?? undefined;
  try {
    const completion = await openai.chat.completions.create({
      messages: req.body.messages,
      model: req.body.options.model,
      functions,
      function_call: functions ? "auto" : undefined,
      temperature: req.body.options.temperature,
      max_tokens: req.body.options.maxTokens,
    });
    if (completion.choices.length < 1) {
      return res.status(400).send({})
    }

    const choice = completion.choices[0];

    if (!choice.message) {
      return res.status(400).send({})
    }

    return res.status(200).json({ message: choice.message });
  } catch (e: any) {
    // Rate limit error
    if (e instanceof OpenAIApi.APIError && e.status === 429) {
      return res.status(429).send({})
    }

    console.error(e);
    return res.status(500).send({})
  }
}
