import { getAuthOptions } from "@/lib/api/authOptions";
import NextAuth from "next-auth";
import { NextRequest } from "next/server";

export function GET(req: NextRequest, res: any) {
  return NextAuth(req, res, getAuthOptions())
}

export function POST(req: NextRequest, res: any) {
  return NextAuth(req, res, getAuthOptions())
}
