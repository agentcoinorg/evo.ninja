import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { createSupabaseClient } from "../../../api-utils/supabase";

const GOALS_PER_DAY_CAP = 5;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(req.method === "POST")) {
    return res.status(404).send({});
  }

  const supabase = createSupabaseClient();
  const currentDate = new Date().toISOString();

  // If the user does not need this goal to be subsidizied
  if (!req.body.subsidize) {
    // Simply add the goal to the database and return
    const goalAdded = await supabase
      .from("goals")
      .insert({
        prompt: req.body.message,
        submission_date: currentDate,
        subsidized: false
      })
      .select()
      .single();
    if (goalAdded.error) {
      console.error(goalAdded.error);
      return res.status(500).send({});
    }
    return res.status(200).send({
      goalAdded: goalAdded.data,
    });
  }

  // The user's goal needs to be subsidized, ensure they're
  // signed in and still have enough allowance
  const session = await getServerSession(req, res, authOptions);
  const email = session?.user?.email;
  if (!session || !email) {
    return res.status(401).send({})
  }

  const { data: goals, error } = await supabase
    .from("goals")
    .select()
    .eq("user_email", email)
    .eq("submission_date", currentDate);

  if (error) {
    console.error(error);
    return res.status(500).send({});
  }

  if (goals?.length && goals.length >= GOALS_PER_DAY_CAP) {
    return res.status(403).send({});
  }

  const goalAdded = await supabase
    .from("goals")
    .insert({
      user_email: session.user?.email,
      prompt: req.body.message,
      submission_date: new Date().toISOString(),
      subsidized: true
    })
    .select()
    .single();

  if (goalAdded.error) {
    console.error(goalAdded.error);
    return res.status(500).send({});
  }
  return res.status(200).send({
    goalAdded: goalAdded.data,
  });
}
