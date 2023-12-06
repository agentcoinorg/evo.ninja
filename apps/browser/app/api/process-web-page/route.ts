import { processWebpage } from "@evo-ninja/agents";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')
  try {
    const result = await processWebpage(url as string);
    return NextResponse.json({ text: result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({}, { status: 500 });
  }
}
