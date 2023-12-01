import { searchOnGoogle } from "@evo-ninja/agents";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest
) {
  const searchParams = req.nextUrl.searchParams
  const query = searchParams.get('query') as string;
  const results = await searchOnGoogle(query as string, process.env.SERP_API_KEY as string);
  return NextResponse.json({ googleResults: results }, {
    status: 200
  });
}
