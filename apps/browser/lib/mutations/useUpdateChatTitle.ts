import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../supabase/useSupabaseClient";

export const useUpdateChatTitle = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();

  return useMutation({
    mutationFn: async (args: { chatId: string; title: string }) => {
      if (!supabase) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase
        .from("chats")
        .update({ title: args.title })
        .eq("id", args.chatId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};
