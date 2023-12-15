import { createClient } from "@supabase/supabase-js";
import { Database } from "./dbTypes";
import { EvoSupabaseClient } from "./EvoSupabaseClient";

export const createSupabaseClient = (supabaseAccessToken: string): EvoSupabaseClient => {
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
  );

  return client;
};
