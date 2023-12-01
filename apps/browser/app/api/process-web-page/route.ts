import { processWebpage } from "@evo-ninja/agents";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const result = await processWebpage(url.searchParams.get('url') as string);
  NextResponse.json({ text: result }, {
    status: 200
  });
}
