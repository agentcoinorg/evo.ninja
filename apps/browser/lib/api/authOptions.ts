import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import jwt from "jsonwebtoken"
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { AuthOptions, SessionStrategy } from "next-auth";

export const getAuthOptions = (): AuthOptions => ({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY as string
  }),
  secret: process.env.NEXTAUTH_JWT_SECRET,
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 4 * 60 * 60, // 4 hours in seconds
  },
  callbacks: {
    async session({ session, token }) {
      const signingSecret = process.env.SUPABASE_JWT_SECRET

      if (!signingSecret) {
        throw new Error("SUPABASE_JWT_SECRET env not set")
      }

      const payload = {
        aud: "authenticated",
        exp: Math.floor(new Date(session.expires).getTime() / 1000),
        sub: token.sub,
        email: session?.user?.email,
        role: "authenticated",
      }

      if (!token.sub) {
        throw new Error("No token.sub")
      }

      session.user = {
        ...session.user,
        id: token.sub
      }
      session.supabaseAccessToken = jwt.sign(payload, signingSecret)

      return session
    },
  }
});