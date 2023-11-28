import { useEffect, useState } from "react"
import { useSupabase } from "../useSupabase"
import { PostgrestError } from "@supabase/supabase-js"

export const useChats = () => {
  const supabase = useSupabase()
  const [chats, setChats] = useState<any[] | null | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<PostgrestError | null | undefined>()

  useEffect(() => {
    if (supabase) {
      (async () => {
        setLoading(true)
  
        const fetchedChats = await supabase.client
          .from('chats')
          .select(`
            id,
            created_at,
            user_id,
            messages (
              id,
              role,
              content,
              created_at,
              name,
              function_call
            )
          `)
          .eq("user_id", supabase.userId)
  
        setLoading(false)
        setError(fetchedChats?.error)
        setChats(fetchedChats?.data)
      })()
    }
  }, [supabase])

  return { chats, loading, error }
}