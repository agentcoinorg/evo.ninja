import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    supabaseAccessToken?: string
    user: {
      address: string
    } & DefaultSession["user"]
  }
}