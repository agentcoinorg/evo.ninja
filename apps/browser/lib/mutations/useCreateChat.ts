import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { createSupabaseClient } from "../supabase/supabase"

export const useCreateChat = () => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const supabase = createSupabaseClient(session?.supabaseAccessToken as string)
      const { data, error } = await supabase
        .from("chats")
        .insert({})
        .select("id")

      if (error) {
        throw new Error(error.message);
      }

      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', session?.user?.email] })
    },
  })
}