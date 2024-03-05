import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createSupabaseBrowserClient } from "@/lib/supabase/createBrowserClient";
import { useSession } from "next-auth/react";

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  const { data : session } = useSession()

  return useMutation({
    mutationFn: async (chatId: string) => {
      if (!session?.supabaseAccessToken) {
        throw new Error("Not authenticated");
      }
      const supabase = createSupabaseBrowserClient(session.supabaseAccessToken);
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