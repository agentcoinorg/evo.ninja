import OpenAIApi from "openai";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { isGoalValid } from "@/lib/api/utils/goal";
import { canUseSubsidy } from "@/lib/api/utils/subsidy";
import { createSupabaseClient } from "@/lib/api/utils/supabase";
import { createOpenAIApiClient } from "@/lib/api/utils/openai";
import { getAuthOptions } from "@/lib/api/authOptions";

export async function POST(
  req: NextRequest
) {
  const body = await req.json();
  const goalId = body.goalId;

  // Ensure the user is logged in
  const session = await getServerSession(getAuthOptions());
  const email = session?.user?.email;
  if (!session || !email) {
    return NextResponse.json({}, { status: 401 });
  }

  const supabase = createSupabaseClient();
  const openai = createOpenAIApiClient();

  // Ensure the goal is being tracked, and we're able to continue
  // subsidizing the goal's llm requests
  const isValid = await isGoalValid(goalId, supabase);
  if (!isValid) {
    console.error("Goal is not valid: ", goalId);
    return NextResponse.json({}, { status: 403 });
  }
  const canSubsidize = await canUseSubsidy("embedding", goalId, supabase);
  if (!canSubsidize) {
    console.error("Cannot subsidize goal: ", goalId);
    return NextResponse.json({}, { status: 403 });
  }

  const inputs: string[] = body.inputs;

  try {
    const { data } = await openai.embeddings.create({
      model: body.model,
      input: inputs,
    });

    const embeddings = data.map((innerData) => {
      return {
        embedding: innerData.embedding,
        index: innerData.index
      };
    });

    return NextResponse.json({ embeddings: embeddings.flat() }, { status: 200 });
  } catch (e: any) {
    // Rate limit error
    if (e instanceof OpenAIApi.APIError && e.status === 429) {
      return NextResponse.json({}, { status: 429 });
    }
    return NextResponse.json({}, { status: 500 });
  }
}
