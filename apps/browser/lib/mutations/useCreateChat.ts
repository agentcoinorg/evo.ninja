import { createSupabaseClient } from "../supabase/createSupabaseClient"
import { Chat } from "@/lib/queries/useChats"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"

export const useCreateChat = () => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (args: { chatId: string, title: string }) => {
      const supabase = createSupabaseClient(session?.supabaseAccessToken as string)
      const { data, error } = await supabase
        .from("chats")
        .insert({
          id: args.chatId,
          title: args.title
        })
        .select("id")

      if (error) {
        throw new Error(error.message);
      }

      return data[0]
    },
    onMutate: async (args: { chatId: string, title: string }) => {
      await queryClient.cancelQueries({ queryKey: ['chats'] })
      queryClient.setQueryData<Chat[]>(['chats'], (old) => [...(old ?? []), {
        id: args.chatId,
        messages: [],
        logs: [],
        title: args.title,
        variables: new Map(),
        created_at: new Date().toISOString()
      }])
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}