import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/createBrowserClient";

export const useUpdateChatTitle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { chatId: string; title: string }) => {
      const supabase = createSupabaseBrowserClient();
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
