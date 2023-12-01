import { searchOnGoogle } from "@evo-ninja/agents";
import { NextResponse } from "next/server";

export async function GET(
  req: NextResponse
) {
  const url = new URL(req.url);
  const results = await searchOnGoogle(url.searchParams.get('query') as string, process.env.SERP_API_KEY as string);
  NextResponse.json({ googleResults: results }, { status: 200 });
}
