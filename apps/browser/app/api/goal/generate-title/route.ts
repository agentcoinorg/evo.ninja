import { getAuthOptions } from "@/lib/api/authOptions";
import { createOpenAIApiClient } from "@/lib/api/utils/openai";
import { createSupabaseClient } from "@/lib/supabase/createSupabaseClient";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chatId = searchParams.get("chatId");
  const prompt = searchParams.get("prompt");

  if (!chatId || !prompt) {
    return NextResponse.json({}, { status: 400 });
  }

  // Make sure user is authenticated
  const session = await getServerSession(getAuthOptions());
  const email = session?.user?.email;
  if (!session || !email) {
    return NextResponse.json({}, { status: 401 });
  }
  const supabase = createSupabaseClient(session.supabaseAccessToken as string);
  const { data, error } = await supabase
    .from("chats")
    .select()
    .eq("id", chatId)
    .single();
  if (error) {
    return NextResponse.json({}, { status: 403 });
  }

  // If the chat has title, there's no need to ask the LLM; return an empty object
  if (data.title) {
    return NextResponse.json({}, { status: 200 });
  }

  try {
    const openAi = createOpenAIApiClient();
    const completion = await openAi.chat.completions.create({
      messages: [
        {
          role: "system",
          content:"Summarize the given prompt using a max 4 words"
        },
        {
          role: "user",
          content: `${prompt}`,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    if (completion.choices.length < 1) {
      return NextResponse.json({}, { status: 400 });
    }

    const choice = completion.choices[0];

    if (!choice.message) {
      return NextResponse.json({}, { status: 400 });
    }

    return NextResponse.json(
      { message: choice.message.content },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({}, { status: 500 });
  }
}
