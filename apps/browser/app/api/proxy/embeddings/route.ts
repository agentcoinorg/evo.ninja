import OpenAIApi from "openai";
import { isGoalValid } from "../../../../api-utils/goal";
import { canUseSubsidy } from "../../../../api-utils/subsidy";
import { createOpenAIApiClient } from "../../../../api-utils/openai";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../src/supabase/createServerClient";
import { cookies } from "next/headers";

export async function POST(
  req: NextRequest,
) {
  const body = await req.json();
  const goalId = body.goalId;

  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  // Ensure the user is logged in
  const { data: session } = await supabase.auth.getSession();
  const email = session?.user?.email;
  if (!session || !email) {
    return NextResponse.json({}, { status: 401 });
  }

  const openai = createOpenAIApiClient();

  // Ensure the goal is being tracked, and we're able to continue
  // subsidizing the goal's llm requests
  const isValid = await isGoalValid(goalId, supabase);
  if (!isValid) {
    return NextResponse.json({}, { status: 403 });
  }
  const canSubsidize = await canUseSubsidy("embedding", goalId, supabase);
  if (!canSubsidize) {
    return NextResponse.json({}, { status: 403 });
  }

  const input: string[][] = body.input;
  try {
    const embeddings = await Promise.all(
      input.map(async (inputs) => {
        const { data } = await openai.embeddings.create({
          model: body.model,
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
    return NextResponse.json({ embeddings: embeddings.flat() }, { status: 200 });
  } catch (e: any) {
    // Rate limit error
    if (e instanceof OpenAIApi.APIError && e.status === 429) {
      return NextResponse.json({}, { status: 429 });
    }
    return NextResponse.json({}, { status: 500 });
  }
}
