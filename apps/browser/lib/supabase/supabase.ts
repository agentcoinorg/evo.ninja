import { createClient } from "@supabase/supabase-js";
import { Database } from "./dbTypes";

export const createSupabaseClient = (supabaseAccessToken: string) => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw Error("Env missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw Error("Env missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseAccessToken}`,
        },
      },
    }
  )

  return client;
}