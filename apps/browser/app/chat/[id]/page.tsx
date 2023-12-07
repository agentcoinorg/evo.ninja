"use client";

import { useEvo } from "@/lib/hooks/useEvo";
import Chat, { ChatMessage } from "@/components/Chat";
import { useRouter } from "next/router";
import { useState } from "react";
import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { useHandleAuth } from "@/lib/hooks/useHandleAuth";

export default function ChatPage() {
  // const router = useRouter();
  // const chatId = router.query.id as string;

  // const [messages, setMessages] = useState<ChatMessage[]>([]);
  // const checkForUserFiles = useCheckForUserFiles();

  // const onMessage = (message: ChatMessage) => {
  //   setMessages((messages) => [...messages, message]);
  //   checkForUserFiles();
  // };

  // const {
  //   isRunning,
  //   isPaused,
  //   isSending,
  //   isStopped,
  //   start,
  //   onContinue,
  //   onPause,
  //   setIsSending,
  // } = useEvo({ chatId, onMessage });
  // const { handlePromptAuth } = useHandleAuth();

  // const handleSend = async (newMessage: string) => {
  //   if (!newMessage) return;
  //   const authorized = await handlePromptAuth(newMessage);
  //   if (!authorized) {
  //     return;
  //   }
  //   onMessage({
  //     title: newMessage,
  //     user: "user",
  //   });
  //   setIsSending(true);
  //   start(newMessage);
  // };

  return (
    <></>
    // <Chat
    //   messages={messages}
    //   samplePrompts={[]}
    //   isPaused={isPaused}
    //   isRunning={isRunning}
    //   isSending={isSending}
    //   isStopped={isStopped}
    //   onPromptSent={handleSend}
    //   onPause={onPause}
    //   onContinue={onContinue}
    // />
  );
}
