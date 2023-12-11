import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { ChatMessage } from "@/components/Chat"
import { Row } from "../supabase/types"
import { createSupabaseClient } from "../supabase/supabase"

const mapChatLogToLogDTO = (
  chatId: string,
  chatLog: ChatMessage
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
      log: ChatMessage;
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