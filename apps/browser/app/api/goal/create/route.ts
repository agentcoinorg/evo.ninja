import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/api/utils/supabase";
import { getAuthOptions } from "@/lib/api/authOptions";

const GOALS_PER_DAY_CAP = 5;

export async function POST(request: Request) {
  const supabase = createSupabaseClient();
  const currentDate = new Date().toISOString();
  const session = await getServerSession(getAuthOptions());
  const email = session?.user?.email;
  const body = await request.json();

  // If the user does not need this goal to be subsidizied
  if (!body.subsidize) {
    // Simply add the goal to the database and return
    const goalAdded = await supabase
      .from("goals")
      .insert({
        user_email: email,
        prompt: body.message,
        submission_date: currentDate,
        subsidized: false
      })
      .select()
      .single();
    if (goalAdded.error) {
      console.error(goalAdded.error);
      return NextResponse.json({}, { status: 500 });
    }
    return NextResponse.json({
      goalAdded: goalAdded.data,
    }, {
      status: 200
    });
  }

  // The user's goal needs to be subsidized, ensure they're
  // signed in and still have enough allowance
  if (!session || !email) {
    return NextResponse.json({}, {
      status: 401
    })
  }

  const { data: goals, error } = await supabase
    .from("goals")
    .select()
    .eq("user_email", email)
    .eq("submission_date", currentDate);

  if (error) {
    console.error(error);
    return NextResponse.json({}, {
      status: 500
    });
  }

  if (goals?.length && goals.length >= GOALS_PER_DAY_CAP) {
    console.error("Goals per day cap reached.", goals?.length);
    return NextResponse.json({}, {
      status: 403
    });
  }

  const goalAdded = await supabase
    .from("goals")
    .insert({
      user_email: email,
      prompt: body.message,
      submission_date: new Date().toISOString(),
      subsidized: true
    })
    .select()
    .single();

  if (goalAdded.error) {
    console.error(goalAdded.error);
    return NextResponse.json({}, {
      status: 500
    });
  }
  return NextResponse.json({
    goalAdded: goalAdded.data
  }, {
    status: 200
  });
}
