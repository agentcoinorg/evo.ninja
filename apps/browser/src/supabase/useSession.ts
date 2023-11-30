import { useEffect, useState } from "react"
import { useSupabase } from "./useSupabase"
import { AuthChangeEvent, Session } from "@supabase/supabase-js"

export const useSession = () => {
  const [session, setSession] = useState<Session | null>()
  const [lastSessionEvent, setLastSessionEvent] = useState<AuthChangeEvent>()
  const supabase = useSupabase()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((e, supabaseSession) => {
      setLastSessionEvent(e)
      setSession(supabaseSession)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  return { session, lastSessionEvent }
}