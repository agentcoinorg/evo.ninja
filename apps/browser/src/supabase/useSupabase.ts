import { SupabaseClient, createClient } from "@supabase/supabase-js"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Database } from "./types/database"

export const useSupabase = () => {
  const { data: session } = useSession()
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient<Database> | null>(null)

  useEffect(() => {
    if (session && session.supabaseAccessToken) {
      const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        {
          global: {
            headers: {
              Authorization: `Bearer ${session.supabaseAccessToken}`,
            },
          },
        }
      );

      const user = supabase.auth.getSession();
      console.log(user)
      setSupabaseClient(supabase)
    }
  }, [session])

  return supabaseClient
}