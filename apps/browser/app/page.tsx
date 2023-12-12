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
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { chatIdAtom, errorAtom, userWorkspaceAtom } from "@/lib/store";
import { SupabaseBucketWorkspace } from "@/lib/supabase/SupabaseBucketWorkspace";
import { useSupabaseClient } from "@/lib/supabase/useSupabaseClient";

function Dojo({ params }: { params: { id?: string } }) {
  const createChat = useCreateChat();
  const { mutateAsync: addMessages } = useAddMessages();
  const { mutateAsync: addChatLog } = useAddChatLog();
  const { mutateAsync: addVariable } = useAddVariable();

  const { handlePromptAuth } = useHandleAuth();
  const checkForUserFiles = useCheckForUserFiles();
  const router = useRouter();
  const [, setError] = useAtom(errorAtom);
  const [chatId, setChatId] = useAtom(chatIdAtom);
  const supabase = useSupabaseClient();
  const [, setUserWorkspace] = useAtom(userWorkspaceAtom);

  const { status: sessionStatus, data: session } = useSession();
  const { data: chats } = useChats();

  const isAuthenticatedRef = useRef<boolean>(false);
  const inMemoryLogsRef = useRef<ChatMessage[]>([]);

  const [inMemoryLogs, setInMemoryLogs] = useState<ChatMessage[]>([]);

  const currentChat = chats?.find((c) => c.id === chatId);
  const logs = currentChat?.logs ?? [];
  const logsToShow = isAuthenticatedRef.current ? logs : inMemoryLogs;

  useEffect(() => {
    (async () => {
      if (!params.id) {
        return;
      }

      console.log("Setting chat id", params.id);
      const workspace = new SupabaseBucketWorkspace(
        params.id,
        supabase.storage
      );
      await workspace.init();
      setChatId(params.id);
      setUserWorkspace(workspace);
    })();
  }, [params.id]);

  const onMessagesAdded = async (
    type: ChatLogType,
    messages: AgentMessage[]
  ) => {
    if (!isAuthenticatedRef.current) {
      return;
    }

    if (!chatId) {
      throw new Error("No ChatID to add messages");
    }

    await addMessages({
      chatId,
      messages,
      type,
    });
  };

  const onVariableSet = async (key: string, value: string) => {
    if (!isAuthenticatedRef.current) {
      return;
    }

    if (!chatId) {
      throw new Error("No ChatID to add variable");
    }

    await addVariable({
      chatId,
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

    if (!chatId) {
      throw new Error("No ChatID to add chat log");
    }

    await addChatLog({ chatId, log });
  };

  const handleSend = async (newMessage: string) => {
    if (!newMessage) return;
    const authorized = await handlePromptAuth(newMessage);

    if (!authorized) {
      return;
    }

    if (!currentChat?.messages.length && isAuthenticatedRef.current) {
      await createChat();
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

    if (
      sessionStatus === "authenticated" &&
      params.id &&
      chats &&
      !currentChat
    ) {
      setError(`Chat with id '${params.id}' not found`);
      router.push("/");
      return;
    }
  }, [sessionStatus, currentChat, params.id]);

  return (
    <Chat
      messages={logsToShow}
      samplePrompts={!logsToShow.length ? examplePrompts : undefined}
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
