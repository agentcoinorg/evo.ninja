import { createSupabaseClient } from "../supabase/createSupabaseClient"
import { Chat } from "@/lib/queries/useChats"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"

export const useCreateChat = () => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (chatId: string) => {
      const supabase = createSupabaseClient(session?.supabaseAccessToken as string)
      const { data, error } = await supabase
        .from("chats")
        .insert({
          id: chatId
        })
        .select("id")

      if (error) {
        throw new Error(error.message);
      }

      return data[0]
    },
    onMutate: async (chatId: string) => {
      await queryClient.cancelQueries({ queryKey: ['chats'] })
      queryClient.setQueryData<Chat[]>(['chats'], (old) => [...(old ?? []), {
        id: chatId,
        messages: [],
        logs: [],
        variables: new Map(),
        created_at: new Date().toISOString()
      }])
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}