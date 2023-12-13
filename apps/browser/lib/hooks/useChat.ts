import { useChats } from "@/lib/queries/useChats";
import { errorAtom } from "@/lib/store";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";

export const useChat = (chatId: string | undefined) => {
  const { data: chats } = useChats();
  const router = useRouter();
  const [, setError] = useAtom(errorAtom);

  if (!chats) {
    return [];
  }

  const currentChat = chats.find(c => c.id === chatId);

  if (chatId && !currentChat) {
    setError(`Chat with id '${chatId}' not found`);
    router.push('/');
  }

  const logs = currentChat?.logs ?? [];
  return logs;
}
