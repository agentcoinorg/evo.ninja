import OpenAIApi from "openai";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { isGoalValid } from "@/lib/api/utils/goal";
import { canUseSubsidy } from "@/lib/api/utils/subsidy";
import { createSupabaseClient } from "@/lib/api/utils/supabase";
import { createOpenAIApiClient } from "@/lib/api/utils/openai";
import { getAuthOptions } from "@/lib/api/authOptions";

export async function POST(
  req: NextRequest,
) {
  const body = await req.json();
  const goalId = body.goalId;

  // Ensure the user is logged in
  const session = await getServerSession(getAuthOptions());
  const email = session?.user?.email;
  if (!session || !email) {
    return NextResponse.json({}, { status: 401 })
  }

  const supabase = createSupabaseClient();
  const openai = createOpenAIApiClient();

  // Ensure the goal is being tracked, and we're able to continue
  // subsidizing the goal's completions requests
  const isValid = await isGoalValid(goalId, supabase);
  if (!isValid) {
    console.error("Goal is not valid: ", goalId);
    return NextResponse.json({}, { status: 403 });
  }
  const canSubsidize = await canUseSubsidy("completions", goalId, supabase);
  if (!canSubsidize) {
    console.error("Cannot subsidize goal: ", goalId);
    return NextResponse.json({}, { status: 403 });
  }

  const functions = body.functions ?? undefined;
  try {
    const completion = await openai.chat.completions.create({
      messages: body.messages,
      model: body.options.model,
      functions,
      function_call: functions ? "auto" : undefined,
      temperature: body.options.temperature,
      max_tokens: body.options.maxTokens,
    });
    if (completion.choices.length < 1) {
      return NextResponse.json({}, { status: 400 })
    }

    const choice = completion.choices[0];

    if (!choice.message) {
      return NextResponse.json({}, { status: 400 })
    }

    return NextResponse.json({ message: choice.message }, { status: 200 });
  } catch (e: any) {
    // Rate limit error
    if (e instanceof OpenAIApi.APIError && e.status === 429) {
      return NextResponse.json({}, { status: 429 })
    }

    console.error(e);
    return NextResponse.json({}, { status: 500 })
  }
}
