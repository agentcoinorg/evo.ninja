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
  
        const fetchedChats = await supabase?.from('chats').select('*')
  
        setLoading(false)
        setError(fetchedChats?.error)
        setChats(fetchedChats?.data)
      })()
    }
  }, [supabase])

  return { chats, loading, error }
}