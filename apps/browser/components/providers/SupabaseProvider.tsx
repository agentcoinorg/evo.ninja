import { supabaseAtom } from "@/lib/store"
import { Database } from "@/lib/supabase/dbTypes"
import { createClient } from "@supabase/supabase-js"
import { useAtom } from "jotai"
import { useSession } from "next-auth/react"
import { useEffect } from "react"

export default function SupabaseProvider({ children }: { children: any }) {
  const { data: session } = useSession()
  const [, setSupabase] = useAtom(supabaseAtom);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw Error("Env missing NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw Error("Env missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    const client = createClient<Database>(
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

    setSupabase(client);
  }, [session?.supabaseAccessToken])

  return children
}