import { useSupabaseClient } from "../supabase/useSupabaseClient";
import { Row } from "../supabase/types";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ChatMessage } from "@/components/Chat";

const mapChatLogToLogDTO = (
  chatId: string,
  chatLog: ChatMessage
): Omit<Row<"logs">, "id" | "created_at"> => {
  return {
    chat_id: chatId,
    title: chatLog.title,
    content: chatLog.content ?? null,
    user: chatLog.user,
  };
};

export const useAddChatLog = () => {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { chatId: string; log: ChatMessage }) => {
      const { error } = await supabase
        .from("logs")
        .insert(mapChatLogToLogDTO(args.chatId, args.log));

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};
