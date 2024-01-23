import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createSupabaseBrowserClient } from "@/lib/supabase/createBrowserClient";

export const useDeleteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      const supabase = createSupabaseBrowserClient();
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