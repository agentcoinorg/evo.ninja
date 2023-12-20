"use client";

import {
  evoServiceAtom,
  workspaceAtom,
  workspaceFilesAtom,
  chatInfoAtom,
  localOpenAiApiKeyAtom,
  showAccountModalAtom,
  errorAtom,
  newGoalSubmittedAtom,
  isChatLoadingAtom,
} from "@/lib/store";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { useUpdateChatTitle } from "@/lib/mutations/useUpdateChatTitle";
import { EvoService } from "@/lib/services/evo/EvoService";
import { useEvoService } from "@/lib/hooks/useEvoService";
import { useWorkspaceUploadUpdate } from "@/lib/hooks/useWorkspaceUploadUpdate";
import Chat from "@/components/Chat";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { v4 as uuid } from "uuid";
import { InMemoryFile } from "@nerfzael/memory-fs";
import { useChats } from "@/lib/queries/useChats";
import { ChatApi } from "@/lib/api/ChatApi";

function Dojo({ params }: { params: { id?: string } }) {
  const [evoService, setEvoService] = useAtom(evoServiceAtom);
  const [newGoalSubmitted, setNewGoalSubmitted] = useAtom(newGoalSubmittedAtom);
  const [isChatLoading, setIsChatLoading] = useAtom(isChatLoadingAtom);
  const [, setError] = useAtom(errorAtom);
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [, setWorkspaceFiles] = useAtom(workspaceFilesAtom);
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [, setAccountModalOpen] = useAtom(showAccountModalAtom);
  const [{ id: chatId }, setChatInfo] = useAtom(chatInfoAtom);

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const { data: chats } = useChats();
  const router = useRouter();
  const { status: sessionStatus, data: sessionData } = useSession();
  const isAuthenticated = sessionStatus === "authenticated";

  const { mutateAsync: createChat } = useCreateChat();
  const { mutateAsync: updateChatTitle } = useUpdateChatTitle();
  const { logs, isConnected, isStarting, isRunning, handleStart } = useEvoService(
    chatId,
    isAuthenticated
  );

  const workspaceUploadUpdate = useWorkspaceUploadUpdate();

  const handleChatIdChange = (newChatId?: string) => {
    if (chatId === newChatId) {
      return;
    }
    setChatInfo({ id: newChatId });

    if (newChatId) {
      setIsChatLoading(true);
    }

    // reset workspace and user files on chatId change
    setWorkspace(undefined);
    setWorkspaceFiles([]);
  }

  const handleCreateNewChat = async () => {
    const id = uuid();
    await createChat(id);
    router.push(`/chat/${id}`);
    setIsChatLoading(true);
    return id;
  };

  const handleGoalSubmit = async (goal: string): Promise<void> => {
    if (isStarting || isRunning) {
      setError("Goal is already in progress.");
      return;
    }

    const firstTimeUser = !localOpenAiApiKey && !isAuthenticated;
    if (firstTimeUser) {
      setError("Please login or add an OpenAI API key.");
      setAccountModalOpen(true);
      return;
    }

    let goalChatId = chatId;

    if (!goalChatId) {
      goalChatId = await handleCreateNewChat();
    }

    const currentChat = chats?.find((c) => c.id === goalChatId);
    if (!currentChat || !currentChat.title) {
      ChatApi.generateTitle(goalChatId, goal).then(async (title) => {
        if (title && goalChatId) {
          await updateChatTitle({ chatId: goalChatId, title });
          setChatInfo({ name: title });
        }
      });
    }

    setNewGoalSubmitted({
      goal,
      chatId: goalChatId
    });
  };

  // Upon authentication changes, apply the chatId
  // and recreate the evoService if necessary
  useEffect(() => {
    if (sessionStatus !== "loading") {
      setIsAuthLoading(false);
    }
    if (sessionStatus === "unauthenticated") {
      if (params.id) {
        router.push("/");
      }
      handleChatIdChange("<anon>");
    } else if (sessionStatus === "authenticated") {
      handleChatIdChange(params.id);
      const user = sessionData?.user.email || "<anon>";
      if (evoService.user !== user) {
        evoService.disconnect();
        evoService.destroy();
        setEvoService(new EvoService(user));
      }
    }
  }, [sessionStatus, params.id, sessionData, evoService]);

  // Set isChatLoading to true when evoService is connected
  // and the current chatId matches the current goal (if present)
  useEffect(() => {
    const chatIdMatches = !newGoalSubmitted || chatId === newGoalSubmitted.chatId;
    if (isChatLoading && isConnected && chatIdMatches) {
      setIsChatLoading(false);
    }
  }, [isChatLoading, isConnected, chatId, newGoalSubmitted]);

  // Upon a new goal being submitted, we must wait until the
  // current page's chatId matches before we start its execution
  useEffect(() => {
    if (newGoalSubmitted && chatId === newGoalSubmitted.chatId) {
      handleStart(newGoalSubmitted.goal);
      setNewGoalSubmitted(undefined);
    }
  }, [newGoalSubmitted, chatId]);

  return (
    <>
      {!isAuthLoading && !isChatLoading ? (
        <Chat
          logs={logs}
          isStarting={isStarting}
          isRunning={isRunning}
          onGoalSubmit={handleGoalSubmit}
          onUpload={(uploads: InMemoryFile[]) => {
            if (!chatId && !isChatLoading) {
              handleCreateNewChat();
            } else if (workspace) {
              workspaceUploadUpdate(workspace, uploads);
            }
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-black/10 border-l-cyan-600" />
        </div>
      )}
    </>
  );
}

export default Dojo;
