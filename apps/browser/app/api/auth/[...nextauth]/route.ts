import { getAuthOptions } from "@/lib/api/authOptions";
import NextAuth from "next-auth";

const handler = NextAuth(getAuthOptions());
export { handler as GET, handler as POST };