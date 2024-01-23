import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChatLog } from "@/components/Chat"
import { Row } from "../supabase/types"
import { createSupabaseBrowserClient } from "../supabase/createBrowserClient"
import { useSession } from "next-auth/react"

const mapChatLogToLogDTO = (
  chatId: string,
  chatLog: ChatLog
): Omit<Row<'logs'>, "id" | "created_at"> => {
  return {
    chat_id: chatId,
    title: chatLog.title,
    content: chatLog.content ?? null,
    user: chatLog.user,
  }
}

export const useAddChatLog = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  
  return useMutation({
    mutationFn: async (args: {
      chatId: string;
      log: ChatLog;
    }) => {
      if (!session?.supabaseAccessToken) {
        throw new Error("Not authenticated");
      }
      const supabase = createSupabaseBrowserClient(session.supabaseAccessToken);
      const { error } = await supabase
        .from("logs")
        .insert(
          mapChatLogToLogDTO(args.chatId, args.log)
        )

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}