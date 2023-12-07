"use client";

import Chat, { ChatMessage } from "@/components/Chat";
import { ExamplePrompt, examplePrompts } from "@/lib/examplePrompts";
import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { useEvo } from "@/lib/hooks/useEvo";
import { useHandleAuth } from "@/lib/hooks/useHandleAuth";
import { useAddChatLog } from "@/lib/mutations/useAddChatLog";
import { useAddMessages } from "@/lib/mutations/useAddMessages";
import { useAddVariable } from "@/lib/mutations/useAddVariable";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { useChats } from "@/lib/queries/useChats";
import { errorAtom } from "@/lib/store";
import { ChatLogType, ChatMessage as AgentMessage } from "@evo-ninja/agents";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function Dojo({ params }: { params: { id?: string } }) {
  const router = useRouter()
  const { mutateAsync: createChat } = useCreateChat()
  const { mutateAsync: addMessages } = useAddMessages()
  const { mutateAsync: addChatLog } = useAddChatLog()
  const { mutateAsync: addVariable } = useAddVariable()
  const { data: chats } = useChats()
  const [, setError] = useAtom(errorAtom)
  const [currentChat, setCurrentChat] = useState<{ id: string }>();

  const chatIdRef = useRef<string | undefined>()
  const [samplePrompts, setSamplePrompts] = useState<ExamplePrompt[] | undefined>(examplePrompts)
  const checkForUserFiles = useCheckForUserFiles();

  useEffect(() => {
    if (chats && params.id) {
      const foundChat = chats.find(c => c.id === params.id)

      if (foundChat) {
        setCurrentChat(foundChat)
        return;
      }

      setError("No chat with this ID")
      router.push('/')
    }
  }, [chats])

  const onAgentMessages = async (type: ChatLogType, messages: AgentMessage[]) => {
    const chatId = chatIdRef.current;

    if (!chatId) {
      throw new Error("No ChatID to add messages")
    }

    await addMessages({
      chatId,
      messages,
      type
    })
  }

  const onVariableSet = async (key: string, value: string) => {
    const chatId = chatIdRef.current;

    if (!chatId) {
      throw new Error("No ChatID to add variable")
    }

    await addVariable({
      chatId,
      key,
      value
    })
  }

  const onChatLog = async (log: ChatMessage) => {
    const chatId = chatIdRef.current;

    if (!chatId) {
      throw new Error("No ChatID to add chat log")
    }

    await addChatLog({ chatId, log })
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
    setSamplePrompts(undefined)

    if (!messages.length) {
      const createdChat = await createChat()

      if (!createdChat) {
        return;
      }

      chatIdRef.current = createdChat.id
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
      messages={[]}
      samplePrompts={samplePrompts}
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
