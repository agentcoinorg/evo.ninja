"use client";

import Chat, { ChatMessage } from "@/components/Chat";
import { ExamplePrompt, examplePrompts } from "@/lib/examplePrompts";
import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { useEvo } from "@/lib/hooks/useEvo";
import { useHandleAuth } from "@/lib/hooks/useHandleAuth";
import { mapAgentOutputToOutputDTO, mapChatMessageToMessageDTO, mapVariableToVariableDTO } from "@/lib/supabase/evo";
import { useSupabase } from "@/lib/supabase/useSupabase";
import { ChatLogType, ChatMessage as AgentMessage } from "@evo-ninja/agents";
import { useRef, useState } from "react";

function Dojo() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatIdRef = useRef<string | undefined>()
  const [samplePrompts, setSamplePrompts] = useState<ExamplePrompt[] | undefined>(examplePrompts)
  const checkForUserFiles = useCheckForUserFiles();
  const supabase = useSupabase()
  const createChat = async () => {
    const { data, error } = await supabase.from("chats").insert({}).select("id, created_at")

    if (error) {
      throw new Error(error.message);
    }

    return data[0]
  }

  const addMessages = async (temporary: ChatLogType, messages: AgentMessage[]) => {
    const chatId = chatIdRef.current;

    if (!chatId) {
      throw new Error("No ChatID to add messages")
    }

    const { error } = await supabase
      .from("messages")
      .insert(
        messages.map(msg => mapChatMessageToMessageDTO(chatId, temporary === "temporary", msg))
      )

    if (error) {
      throw new Error(error.message);
    }
  }

  const addVariableToChat = async (key: string, value: string) => {
    const chatId = chatIdRef.current;

    if (!chatId) {
      throw new Error("No ChatID to add variable")
    }

    const { error } = await supabase
      .from("variables")
      .insert(
        mapVariableToVariableDTO(chatId, key, value)
      )

    if (error) {
      throw new Error(error.message);
    }
  }

  const addChatLog = async (log: ChatMessage) => {
    const chatId = chatIdRef.current;

    if (!chatId) {
      throw new Error("No ChatID to add chat log")
    }

    const { error } = await supabase
      .from("logs")
      .insert(
        mapAgentOutputToOutputDTO(chatId, log)
      )

    if (error) {
      throw new Error(error.message);
    }
  }

  const onChatLog = async (message: ChatMessage) => {
    setMessages((messages) => [...messages, message]);
    await addChatLog(message)
    checkForUserFiles();
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
    onAgentMessages: addMessages,
    onVariableSet: addVariableToChat
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
      messages={messages}
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
