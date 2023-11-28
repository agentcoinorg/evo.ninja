import NextAuth, { DefaultSession, Session, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken"

declare module "next-auth" {
  interface Session {
    supabaseAccessToken?: string
    user: {
      address: string
    } & DefaultSession["user"]
  }
}

export const authOptions = {
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
    url: process.env.SUPABASE_URL as string,
    secret: process.env.SUPABASE_ANON_KEY as string
  }),
  callbacks: {
    async session({ session, user }: { session: Session, user: User}) {
      const signingSecret = process.env.SUPABASE_JWT_SECRET
      
      if (signingSecret) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: user.id,
          email: user.email,
          role: "authenticated",
        };
        session.supabaseAccessToken = jwt.sign(payload, signingSecret)
      }
      return session
    },
  }
};

export default NextAuth(authOptions);