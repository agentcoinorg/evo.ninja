import { createBrowserClient } from "@supabase/ssr"
import { useState } from "react"

// Singleton instance, no need to use context
export const useSupabase = () => {
  const [supabase] = useState(() =>
    createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  )

  return supabase
}