import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createSupabaseBrowserClient } from "@/lib/supabase/createBrowserClient";
import { useSession } from "next-auth/react";

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  const { data : session } = useSession()

  return useMutation({
    mutationFn: async (chatId: string) => {
      const supabase = createSupabaseBrowserClient(session?.supabaseAccessToken as string);
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