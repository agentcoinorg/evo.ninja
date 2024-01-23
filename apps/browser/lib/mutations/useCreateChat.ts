import { Chat } from "@/lib/queries/useChats"
import { createSupabaseBrowserClient } from "@/lib/supabase/createBrowserClient";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react";

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  const { data : session } = useSession()

  return useMutation({
    mutationFn: async (chatId: string) => {
      const supabase = createSupabaseBrowserClient(session?.supabaseAccessToken as string);
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
        title: null,
        variables: new Map(),
        created_at: new Date().toISOString()
      }])
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}