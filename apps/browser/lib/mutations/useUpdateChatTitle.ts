import { createSupabaseClient } from "../supabase/createSupabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export const useUpdateChatTitle = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { chatId: string; title: string }) => {
      const supabase = createSupabaseClient(
        session?.supabaseAccessToken as string
      );
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
