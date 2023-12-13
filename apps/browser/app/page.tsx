"use client";

import { v4 as uuid } from "uuid";
import Chat, { ChatLog } from "@/components/Chat";
import { examplePrompts } from "@/lib/examplePrompts";
import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { useEvo } from "@/lib/hooks/useEvo";
import { useHandleAuth } from "@/lib/hooks/useHandleAuth";
import { useAddChatLog } from "@/lib/mutations/useAddChatLog";
import { useAddMessages } from "@/lib/mutations/useAddMessages";
import { useAddVariable } from "@/lib/mutations/useAddVariable";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { useChat } from "@/lib/hooks/useChat";
import { ChatLogType, ChatMessage } from "@evo-ninja/agents";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function Dojo({ params }: { params: { id?: string } }) {
  const { mutateAsync: createChat } = useCreateChat()
  const { mutateAsync: addMessages } = useAddMessages()
  const { mutateAsync: addChatLog } = useAddChatLog()
  const { mutateAsync: addVariable } = useAddVariable()

  const { handlePromptAuth } = useHandleAuth();
  const checkForUserFiles = useCheckForUserFiles();
  const router = useRouter()

  const { status: sessionStatus } = useSession()

  const chatIdRef = useRef<string | undefined>(params.id);
  const isAuthenticatedRef = useRef<boolean>(false);
  const inMemoryLogsRef = useRef<ChatLog[]>([])
  const [inMemoryLogs, setInMemoryLogs] = useState<ChatLog[]>([])

  const logs = useChat(chatIdRef.current);

  const onMessagesAdded = async (
    type: ChatLogType,
    messages: ChatMessage[]
  ) => {
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

  const onChatLog = async (log: ChatLog) => {
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

    if (!logs.length && isAuthenticatedRef.current && !params.id) {
      const chatId = uuid();
      const createdChat = await createChat(chatId)

      if (!createdChat) {
        return;
      }

      chatIdRef.current = createdChat.id;

      window.history.pushState(null, "Chat", `/chat/${chatId}`);
    }

    const authorized = await handlePromptAuth(newMessage, chatIdRef.current);

    if (!authorized.complete) {
      return;
    }

    await onChatLog({
      title: newMessage,
      user: "user",
    });

    setIsSending(true);
    start(newMessage, authorized.goalId as string);
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
    onVariableSet,
  });

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      isAuthenticatedRef.current = true;
    }
  }, [sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated" && params.id) {
      router.push("/");
      return;
    }
  }, [sessionStatus, params.id])

  return (
    <Chat
      logs={logs.length ? logs : inMemoryLogs}
      samplePrompts={examplePrompts}
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

export default Dojo;
