import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { ChatLog } from "@/components/Chat"
import { Row } from "../supabase/types"
import { createSupabaseClient } from "../supabase/createSupabaseClient";

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
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (args: {
      chatId: string;
      log: ChatLog;
    }) => {
      const supabase = createSupabaseClient(session?.supabaseAccessToken as string)
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