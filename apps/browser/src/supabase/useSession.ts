import { useEffect, useState } from "react"
import { useSupabase } from "./useSupabase"
import { Session } from "@supabase/supabase-js"

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null)
  const supabase = useSupabase()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_, supabaseSession) => {
      setSession(supabaseSession)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  return session
}