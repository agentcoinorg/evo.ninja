"use client";

import Chat, { ChatMessage } from "@/components/Chat";
import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { useEvo } from "@/lib/hooks/useEvo";
import { useHandleAuth } from "@/lib/hooks/useHandleAuth";
import { useAddChatLog } from "@/lib/mutations/useAddChatLog";
import { useAddMessages } from "@/lib/mutations/useAddMessages";
import { useAddVariable } from "@/lib/mutations/useAddVariable";
import { useChats } from "@/lib/queries/useChats";
import { errorAtom } from "@/lib/store";
import { ChatLogType, ChatMessage as AgentMessage } from "@evo-ninja/agents";
import { useAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { status } = useSession()

  const { mutateAsync: addMessages } = useAddMessages()
  const { mutateAsync: addChatLog } = useAddChatLog()
  const { mutateAsync: addVariable } = useAddVariable()
  const { data: chats } = useChats()

  const [, setError] = useAtom(errorAtom)
  const currentChat = chats?.find(c => c.id === (params.id))

  const logs = currentChat?.logs ?? []
  const checkForUserFiles = useCheckForUserFiles();

  useEffect(() => {
    if (status === "unauthenticated") {
      setError("No chat with this ID")
      router.push('/')
      return;
    }
  }, [status])

  useEffect(() => {
    if (chats && !currentChat) {
      setError("No chat with this ID")
      router.push('/')
      return;
    }
  }, [currentChat])

  const onAgentMessages = async (type: ChatLogType, messages: AgentMessage[]) => {
    await addMessages({
      chatId: params.id,
      messages,
      type
    })
  }

  const onVariableSet = async (key: string, value: string) => {
    await addVariable({
      chatId: params.id,
      key,
      value
    })
  }

  const onChatLog = async (log: ChatMessage) => {
    await addChatLog({ chatId: params.id, log })
    checkForUserFiles();
  }

  const {
    isRunning,
    isPaused,
    isSending,
    isStopped,
    start,
    onContinue,
    onPause,
    setIsSending,
  } = useEvo({
    onChatLog,
    onAgentMessages,
    onVariableSet
  });
  const { handlePromptAuth } = useHandleAuth();

  const handleSend = async (newMessage: string) => {
    if (!newMessage) return;

    const authorized = await handlePromptAuth(newMessage);

    if (!authorized) {
      return;
    }

    await onChatLog({
      title: newMessage,
      user: "user",
    });

    setIsSending(true);
    start(newMessage);
  };

  return (
    <Chat
      messages={logs}
      isPaused={isPaused}
      isRunning={isRunning}
      isSending={isSending}
      isStopped={isStopped}
      onPromptSent={handleSend}
      onPause={onPause}
      onContinue={onContinue}
    />
  );
}

export default ChatPage;
