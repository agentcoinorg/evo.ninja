import { getAuthOptions } from "@/lib/api/authOptions";
import NextAuth from "next-auth";
import { NextRequest } from "next/server";

export const POST = NextAuth(getAuthOptions());

export async function GET(req: NextRequest, res: any) {
  const isDefaultSigninPage = req.nextUrl.pathname.includes("signin")
  return await NextAuth(req, res, getAuthOptions(isDefaultSigninPage));
}
