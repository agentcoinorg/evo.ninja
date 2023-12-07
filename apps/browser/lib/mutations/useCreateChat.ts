import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSupabase } from "../hooks/useSupabase"
import { useSession } from "next-auth/react"

export const useCreateChat = () => {
  const supabase = useSupabase()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
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