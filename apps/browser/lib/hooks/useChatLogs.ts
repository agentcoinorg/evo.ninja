/*import { errorAtom } from "@/lib/store";
import { useChats } from "@/lib/queries/useChats";
import { useAddChatLog } from "@/lib/mutations/useAddChatLog";
import { ChatLog } from "@/components/Chat";
import { useState, useRef } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";

export const useChatLogs = (chatId: string | "<anon>" | undefined): {
  logs: ChatLog[];
  onChatLog: (log: ChatLog) => Promise<void>;
} | undefined => {

  const router = useRouter();
  const [, setError] = useAtom(errorAtom);

  // Try to fetch chats from the user's DB
  const { data: chats } = useChats();
  const { mutateAsync: addChatLog } = useAddChatLog();

  // For anonymous sessions, use in-memory logs
  const inMemoryLogsRef = useRef<ChatLog[]>([]);
  const [inMemoryLogs, setInMemoryLogs] = useState<ChatLog[]>([]);

  if (!chatId) {
    return undefined;
  }

  // Determine what chat log array to use
  let logs = chatId === "<anon>" ? inMemoryLogs : (
    !chats ? [] : undefined
  );

  if (!logs) {
    const currentChat = chats?.find(c => c.id === chatId);

    if (!currentChat) {
      setError(`Chat with id '${chatId}' not found`);
      router.push('/');
      return undefined;
    }

    logs = currentChat.logs;
  }

  const onChatLog = async (log: ChatLog) => {
    if (chatId === "<anon>") {
      inMemoryLogsRef.current = [...inMemoryLogsRef.current, log];
      setInMemoryLogs(inMemoryLogsRef.current);
    } else {
      await addChatLog({ chatId, log });
    }
  };

  return {
    logs,
    onChatLog
  };
}*/
