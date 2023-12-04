import { getAuthOptions } from "@/lib/api/authOptions";
import NextAuth from "next-auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, res: any) {
  const isDefaultSigninPage = req.nextUrl.pathname.includes("signin")
  return await NextAuth(req, res, getAuthOptions(isDefaultSigninPage));
}

export function POST(req: NextRequest, res: any) {
  return NextAuth(req, res, getAuthOptions())
}
