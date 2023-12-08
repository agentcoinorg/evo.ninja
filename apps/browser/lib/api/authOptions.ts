import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { v4 as uuid } from "uuid";
import jwt from "jsonwebtoken"

import { SupabaseAdapter } from "@auth/supabase-adapter";
import { createSupabaseClient } from "./utils/supabase";
import { AuthOptions, SessionStrategy } from "next-auth";

export const getAuthOptions = (skipCredentials = false): AuthOptions => {
  const adapter = SupabaseAdapter({
    url: process.env.SUPABASE_URL as string,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY as string
  })

  const providers = [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
  ]

  const supabase = createSupabaseClient()

  const credentialsProvider = CredentialsProvider({
    name: "Guest Account",
    credentials: {},
    async authorize(credentials, req) {
      const guest_id = uuid()

      const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([
        { id: guest_id },
      ])
      .select("id, email")

      if (insertError) {
        console.log(insertError)
        throw new Error("Error inserting user")
      }

      if (insertData && insertData[0]) {
        return {
          id: guest_id
        }
      }

      return null
    }
  })

  if (!skipCredentials) {
    providers.push(credentialsProvider as any)
  }

  return {
    providers,
    adapter,
    secret: process.env.NEXT_AUTH_SECRET,
    session: {
      strategy: "jwt" as SessionStrategy,
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
  }
};