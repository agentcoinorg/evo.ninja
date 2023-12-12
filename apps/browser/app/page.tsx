"use client";

import Chat, { ChatLog } from "@/components/Chat";
import { examplePrompts } from "@/lib/examplePrompts";
import { useCheckForEvoWorkspaceFiles } from "@/lib/hooks/useCheckForEvoWorkspaceFiles";
import { useEvo } from "@/lib/hooks/useEvo";
import { useHandleAuth } from "@/lib/hooks/useHandleAuth";
import { useAddChatLog } from "@/lib/mutations/useAddChatLog";
import { useAddMessages } from "@/lib/mutations/useAddMessages";
import { useAddVariable } from "@/lib/mutations/useAddVariable";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { useChats } from "@/lib/queries/useChats";
import { ChatLogType, ChatMessage } from "@evo-ninja/agents";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { chatIdAtom, errorAtom, userWorkspaceAtom } from "@/lib/store";
import { SupabaseBucketWorkspace } from "@/lib/supabase/SupabaseBucketWorkspace";
import { useSupabaseClient } from "@/lib/supabase/useSupabaseClient";

function Dojo({ params }: { params: { id?: string } }) {
  const createChat = useCreateChat();
  const supabase = useSupabaseClient();
  const { mutateAsync: addMessages } = useAddMessages();
  const { mutateAsync: addChatLog } = useAddChatLog();
  const { mutateAsync: addVariable } = useAddVariable();

  const { handlePromptAuth } = useHandleAuth();
  const checkForEvoWorkspaceFiles = useCheckForEvoWorkspaceFiles();
  const router = useRouter();
  const [, setError] = useAtom(errorAtom);
  const chatIdRef = useRef<string | undefined>(params.id);
  const [goal, setGoal] = useState<string | undefined>(undefined);
  const [userWorkspace, setUserWorkspace] = useAtom(userWorkspaceAtom);

  const { status: sessionStatus } = useSession();
  const { data: chats } = useChats();

  const isAuthenticatedRef = useRef<boolean>(false);
  const inMemoryLogsRef = useRef<ChatLog[]>([]);

  const [inMemoryLogs, setInMemoryLogs] = useState<ChatLog[]>([]);
  const currentChat = chats?.find((c) => c.id === chatIdRef.current);

  const [logsToShow, setLogsToShow] = useState<ChatLog[]>([]);

  useEffect(() => {
    const logs = currentChat?.logs ?? [];

    setLogsToShow(isAuthenticatedRef.current ? logs : inMemoryLogs);
  }, [chats, chatIdRef.current]);

  useEffect(() => {
    (async () => {
      if (!chatIdRef.current) {
        return;
      }

      if (userWorkspace?.chatId != chatIdRef.current) {
        const workspace = new SupabaseBucketWorkspace(
          chatIdRef.current,
          supabase.storage
        );
        setUserWorkspace(workspace);
        await checkForEvoWorkspaceFiles(workspace);
        console.log("Set workspace", workspace);
      }
    })();
  }, [chatIdRef.current]);

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
    console.log("On chat log", log);
    await checkForEvoWorkspaceFiles();

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

    if (!currentChat?.messages.length && isAuthenticatedRef.current) {
      const { chatId } = await createChat();
      chatIdRef.current = chatId;
      console.log("Created chat", chatId);
    }

    const authorized = await handlePromptAuth(newMessage, chatIdRef.current);

    if (!authorized) {
      return;
    }

    await onChatLog({
      title: newMessage,
      user: "user",
    });

    setIsSending(true);
    start(newMessage);
    setGoal(newMessage);
    console.log("Sending", newMessage);
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
    goal,
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
      logs={logsToShow}
      samplePrompts={!logsToShow?.length ? examplePrompts : undefined}
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
