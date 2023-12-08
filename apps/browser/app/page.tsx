"use client";

import Chat, { ChatMessage } from "@/components/Chat";
import { examplePrompts } from "@/lib/examplePrompts";
import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { useEvo } from "@/lib/hooks/useEvo";
import { useHandleAuth } from "@/lib/hooks/useHandleAuth";
import { useAddChatLog } from "@/lib/mutations/useAddChatLog";
import { useAddMessages } from "@/lib/mutations/useAddMessages";
import { useAddVariable } from "@/lib/mutations/useAddVariable";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { useChats } from "@/lib/queries/useChats";
import { ChatLogType, ChatMessage as AgentMessage } from "@evo-ninja/agents";
import { useRef } from "react";

function Dojo() {
  const { mutateAsync: createChat } = useCreateChat()
  const { mutateAsync: addMessages } = useAddMessages()
  const { mutateAsync: addChatLog } = useAddChatLog()
  const { mutateAsync: addVariable } = useAddVariable()
  const { data: chats } = useChats()
  const chatIdRef = useRef<string | undefined>()
  const currentChat = chats?.find(c => c.id === (chatIdRef.current))
  console.log(currentChat)
  const logs = currentChat?.logs ?? []
  const checkForUserFiles = useCheckForUserFiles();

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

    if (!currentChat?.messages.length) {
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
      messages={logs}
      samplePrompts={chatIdRef.current ? []: examplePrompts}
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
