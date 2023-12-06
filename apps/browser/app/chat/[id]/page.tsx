"use client"

import { useEvo } from "@/lib/hooks/useEvo";
import Chat, { ChatMessage } from "@/components/Chat";
import { useRouter } from "next/router";
import { useState } from "react";
import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";

export default function ChatPage() {
  const router = useRouter();
  const chatId = router.query.id as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const checkForUserFiles = useCheckForUserFiles();

  const onMessage = (message: ChatMessage) => {
    setMessages((messages) => [...messages, message]);
    checkForUserFiles();
  };

  const { evo } = useEvo({ chatId, onMessage })

  const handleSend = async (newMessage?: string) => {
    if (!message && !newMessage) return
    const authorized = await handlePromptAuth(newMessage ?? message)
    if (!authorized) {
      return
    }
    onMessage({
      title: newMessage || message,
      user: "user",
    });
    setSending(true);
    setShowPrompts(false);
    setMessage("");
    setEvoRunning(true);
  };

  const handlePause = async () => {
    setPaused(true);
  };

  const handleContinue = async () => {
    setPaused(false);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !sending) {
      handleSend();
    }
  };


  return (
    <>
      {evo && (
        <Chat
          evo={evo}
          onMessage={onMessage}
          messages={messages}
          sidebarOpen={false}
          overlayOpen={false}
          onSidebarToggleClick={() => {}}
          onUploadFiles={() => {}}
          handlePromptAuth={() => Promise.resolve(true)}
        />
      )}
    </>
  );
}
