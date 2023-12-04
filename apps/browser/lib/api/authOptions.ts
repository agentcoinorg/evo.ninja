import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { sha512 } from "js-sha512";
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
    name: "Open AI API Key",
    credentials: {
      apiKey: { label: "API Key", type: "text" },
    },
    async authorize(credentials, req) {
      if (!credentials?.apiKey) {
        throw new Error("No API key provided")
      }

      if (!process.env.NEXT_AUTH_SECRET) {
        throw new Error("No NEXT_AUTH_SECRET provided")
      }

      const keyHash = sha512.hmac(process.env.NEXT_AUTH_SECRET, credentials.apiKey)

      const { data: selectData, error: selectError } = await supabase
      .from('users')
      .select("id, api_key_hash, email")
      .eq('api_key_hash', keyHash)

      if (selectError) {
        console.log(selectError)
        throw new Error("Error selecting user")
      }

      if (selectData && selectData[0]) {
        return {
          id: selectData[0].id
        }
      }

      const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([
        { api_key_hash: keyHash },
      ])
      .select("id, api_key_hash, email")

      if (insertError) {
        console.log(insertError)
        throw new Error("Error inserting user")
      }

      if (insertData && insertData[0]) {
        return {
          id: insertData[0].id
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
        if (signingSecret) {
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
        }
        return session
      },
    }
  }
};