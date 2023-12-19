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
  // Only can only fetch chats associated with its ID, so if it doesn't return
  // anything it means it is querying a chat from other user
  const { error } = await supabase
    .from("chats")
    .select()
    .eq("id", chatId)
    .single();
  if (error) {
    return NextResponse.json({}, { status: 403 });
  }

  try {
    const openAi = createOpenAIApiClient();
    const completion = await openAi.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Summarize this prompt "${prompt}" into 4 words with no more than 20 characters in total`,
        },
      ],
      model: "gpt-3.5-turbo-1106",
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
