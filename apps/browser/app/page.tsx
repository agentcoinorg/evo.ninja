"use client";

import Chat, { ChatMessage } from "@/components/Chat";
import SidebarIcon from "@/components/SidebarIcon";
import { examplePrompts } from "@/lib/examplePrompts";
import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { useEvo } from "@/lib/hooks/useEvo";
import { useHandleAuth } from "@/lib/hooks/useHandleAuth";
import { sidebarAtom } from "@/lib/store";
import { useAtom } from "jotai";
import { useState } from "react";

function Dojo() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const checkForUserFiles = useCheckForUserFiles();
  const onMessage = (message: ChatMessage) => {
    setMessages((messages) => [...messages, message]);
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
  } = useEvo({ chatId: "", onMessage });
  const { handlePromptAuth } = useHandleAuth();

  const handleSend = async (newMessage: string) => {
    if (!newMessage) return;
    const authorized = await handlePromptAuth(newMessage);
    if (!authorized) {
      return;
    }
    onMessage({
      title: newMessage,
      user: "user",
    });
    setIsSending(true);
    start(newMessage);
  };

  return (
    <Chat
      messages={messages}
      samplePrompts={[]}
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
