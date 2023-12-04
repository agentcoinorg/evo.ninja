import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
  if (!process.env.SUPABASE_URL) {
    throw Error("Env missing SUPABASE_URL");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw Error("Env missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
