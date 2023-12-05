import { useState } from "react"
import { createClient } from "@supabase/supabase-js";

export const useSupabase = () => {
  const [supabase] = useState(() => {

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw Error("Env missing NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw Error("Env missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  })

  return supabase
}