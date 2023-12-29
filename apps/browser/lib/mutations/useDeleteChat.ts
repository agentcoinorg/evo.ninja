import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSupabaseClient } from "../supabase/useSupabaseClient";

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();
  
  return useMutation({
    mutationFn: async (chatId: string) => {
      if (!supabase) {
        throw new Error("Not authenticated");
      }

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