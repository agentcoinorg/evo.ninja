"use client";

import { v4 as uuid } from "uuid";
import Chat, { ChatMessage } from "@/components/Chat";
import CloseSidebarIcon from "@/components/CloseSidebarIcon";
import Sidebar from "@/components/Sidebar";
import WelcomeModal from "@/components/modals/WelcomeModal";
import { examplePrompts } from "@/lib/examplePrompts";
import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { useEvo } from "@/lib/hooks/useEvo";
import { useHandleAuth } from "@/lib/hooks/useHandleAuth";
import { useAddChatLog } from "@/lib/mutations/useAddChatLog";
import { useAddMessages } from "@/lib/mutations/useAddMessages";
import { useAddVariable } from "@/lib/mutations/useAddVariable";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { useChats } from "@/lib/queries/useChats";
import { welcomeModalAtom } from "@/lib/store";
import { ChatLogType, ChatMessage as AgentMessage } from "@evo-ninja/agents";
import { useAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { errorAtom } from "@/lib/store";

function Dojo({ params }: { params: { id?: string } }) {
  const [welcomeModalSeen, setWelcomeModalSeen] = useAtom(welcomeModalAtom);

  const { mutateAsync: createChat } = useCreateChat()
  const { mutateAsync: addMessages } = useAddMessages()
  const { mutateAsync: addChatLog } = useAddChatLog()
  const { mutateAsync: addVariable } = useAddVariable()
  
  const { handlePromptAuth } = useHandleAuth();
  const checkForUserFiles = useCheckForUserFiles();
  const router = useRouter()
  const [, setError] = useAtom(errorAtom)

  const { status: sessionStatus } = useSession();
  const { data: chats } = useChats();

  const chatIdRef = useRef<string | undefined>(params.id)
  const isAuthenticatedRef = useRef<boolean>(false);
  const inMemoryLogsRef = useRef<ChatMessage[]>([])

  const [inMemoryLogs, setInMemoryLogs] = useState<ChatMessage[]>([])

  const currentChat = chats?.find(c => c.id === chatIdRef.current)
  const logs = currentChat?.logs ?? []
  const logsToShow = isAuthenticatedRef.current ? logs : inMemoryLogs;

  const onMessagesAdded = async (type: ChatLogType, messages: AgentMessage[]) => {
    if (!isAuthenticatedRef.current) {
      return;
    }

    if (!chatIdRef.current) {
      throw new Error("No ChatID to add messages");
    }

    await addMessages({
      chatId: chatIdRef.current,
      messages,
      type,
    });
  };

  const onVariableSet = async (key: string, value: string) => {
    if (!isAuthenticatedRef.current) {
      return;
    }

    if (!chatIdRef.current) {
      throw new Error("No ChatID to add variable");
    }

    await addVariable({
      chatId: chatIdRef.current,
      key,
      value,
    });
  };

  const onChatLog = async (log: ChatMessage) => {
    checkForUserFiles();

    if (!isAuthenticatedRef.current) {
      inMemoryLogsRef.current = [...inMemoryLogsRef.current, log];
      setInMemoryLogs(inMemoryLogsRef.current);
      return;
    }

    if (!chatIdRef.current) {
      throw new Error("No ChatID to add chat log");
    }

    await addChatLog({ chatId: chatIdRef.current, log });
  };

  const handleSend = async (newMessage: string) => {
    if (!newMessage) return;
    const authorized = await handlePromptAuth(newMessage);

    if (!authorized) {
      return;
    }

    if (!currentChat?.messages.length && isAuthenticatedRef.current) {
      const chatId = uuid()
      const createdChat = await createChat(chatId)

      if (!createdChat) {
        return;
      }

      chatIdRef.current = createdChat.id

      window.history.pushState(null, "Chat", `/chat/${chatId}`);
    }
    await onChatLog({
      title: newMessage,
      user: "user",
    });

    setIsSending(true);
    start(newMessage);
  };

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
    onMessagesAdded,
    onVariableSet
  });

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      isAuthenticatedRef.current = true
    }
  }, [sessionStatus])

  useEffect(() => {
    if (sessionStatus === "unauthenticated" && params.id) {
      router.push('/')
      return;
    }

    if (sessionStatus === "authenticated" && params.id && chats && !currentChat) {
      setError(`Chat with id '${params.id}' not found`)
      router.push('/')
      return;
    }

  }, [sessionStatus, currentChat, params.id])

  return (
    <>
          {/* <div className="relative flex h-full overflow-x-clip"> */}

      <Chat
        messages={logsToShow}
        samplePrompts={!logsToShow.length ? examplePrompts: undefined}
        isPaused={isPaused}
        isRunning={isRunning}
        isSending={isSending}
        isStopped={isStopped}
        onPromptSent={handleSend}
        onPause={onPause}
        onContinue={onContinue}
      />
      <WelcomeModal
        isOpen={!welcomeModalSeen}
        onClose={() => setWelcomeModalSeen(true)}
      />
    </>
  );
}

export default Dojo;
