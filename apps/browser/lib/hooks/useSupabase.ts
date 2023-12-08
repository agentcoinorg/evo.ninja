import { useMemo } from "react"
import { createClient } from "@supabase/supabase-js";
import { Database } from "../supabase/dbTypes";
import { useSession } from "next-auth/react";

export const useSupabase = () => {
  const { data: session } = useSession()
  const supabase = useMemo(() => {

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw Error("Env missing NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw Error("Env missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      session?.supabaseAccessToken ? {
        global: {
          headers: {
            Authorization: `Bearer ${session?.supabaseAccessToken}`,
          },
        },
      }: undefined
    )
  }, [session?.supabaseAccessToken])

  return supabase
}