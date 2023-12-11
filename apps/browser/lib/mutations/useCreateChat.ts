import { Chat } from "../queries/useChats";
import { useSupabaseClient } from "../supabase/useSupabaseClient";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateChat = () => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      const { data, error } = await supabase
        .from("chats")
        .insert({
          id: chatId,
        })
        .select("id");

      if (error) {
        throw new Error(error.message);
      }

      return data[0];
    },
    onMutate: async (chatId: string) => {
      await queryClient.cancelQueries({ queryKey: ["chats"] });
      queryClient.setQueryData<Chat[]>(["chats"], (old) => [
        ...(old ?? []),
        {
          id: chatId,
          messages: [],
          logs: [],
          variables: new Map(),
          created_at: new Date().toISOString(),
        },
      ]);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};
