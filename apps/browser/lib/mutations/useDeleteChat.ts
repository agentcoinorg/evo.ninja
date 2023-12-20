import { createSupabaseClient } from "../supabase/createSupabaseClient"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"

export const useDeleteChat = () => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (chatId: string) => {
      const supabase = createSupabaseClient(session?.supabaseAccessToken as string)
      const { error } = await supabase
        .from("chats")
        .delete()
        .eq('id', chatId)

      if (error) {
        throw new Error(error.message);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}