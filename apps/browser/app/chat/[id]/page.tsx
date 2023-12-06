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
  // const { evo, proxyEmbeddingApi, proxyLlmApi } = useEvo({
  //   chatId,
  //   onMessage,
  // });

  // const handlePromptAuth = async (message: string) => {
  //   if (awaitingAuth) {
  //     return false;
  //   }

  //   if (firstTimeUser) {
  //     setAccountModalOpen(true);
  //     return false;
  //   }

  //   const subsidize = !localOpenAiApiKey;

  //   setAwaitingAuth(true);
  //   const goalId = await AuthProxy.checkGoal(
  //     allowTelemetry ? message : "<redacted>",
  //     subsidize,
  //     () => {
  //       setCapReached(true);
  //       setAccountModalOpen(true);
  //     }
  //   );
  //   setAwaitingAuth(false);

  //   if (!goalId) {
  //     return false;
  //   }

  //   proxyLlmApi?.setGoalId(goalId);
  //   proxyEmbeddingApi?.setGoalId(goalId);
  //   return true;
  // };

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
