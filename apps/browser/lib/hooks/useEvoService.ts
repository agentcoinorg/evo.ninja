import {
  allowTelemetryAtom,
  capReachedAtom,
  evoServiceAtom,
  localOpenAiApiKeyAtom,
  showAccountModalAtom,
  userWorkspaceAtom,
  errorAtom,
  chatInfoAtom
} from "@/lib/store";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { useAddChatLog } from "@/lib/mutations/useAddChatLog";
import { useAddMessages } from "@/lib/mutations/useAddMessages";
import { useChats } from "@/lib/queries/useChats";
import { useAddVariable } from "@/lib/mutations/useAddVariable";
import { useUpdateUserFiles } from "@/lib/hooks/useUpdateUserFiles";
import { ChatLog } from "@/components/Chat";
import { EvoThreadCallbacks, EvoThreadConfig } from "@/lib/services/evo/EvoThread";
import { v4 as uuid } from "uuid";
import { useAtom } from "jotai";
import { useState, useEffect } from "react";
import { Workspace, InMemoryWorkspace } from "@evo-ninja/agent-utils";
import { ChatLogType, ChatMessage } from "@evo-ninja/agents";
import { SupabaseWorkspace } from "../supabase/SupabaseWorkspace";
import { useSupabaseClient } from "../supabase/useSupabaseClient";
import { useUpdateChatTitle } from "../mutations/useUpdateChatTitle";
import { GoalApi } from "../api";
import { ChatApi } from "../api/ChatApi";

export const useEvoService = (
  chatId: string | "<anon>" | undefined,
  isAuthenticated: boolean,
  onCreateChat: (chatId: string) => void
): {
  logs: ChatLog[] | undefined;
  isStarting: boolean;
  isRunning: boolean;
  handleStart: (goal: string) => void;
} => {
  const supabase = useSupabaseClient();

  // Globals
  const [evoService] = useAtom(evoServiceAtom);
  const [allowTelemetry] = useAtom(allowTelemetryAtom);
  const [openAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [, setUserWorkspace] = useAtom(userWorkspaceAtom);
  const [, setCapReached] = useAtom(capReachedAtom);
  const [, setAccountModalOpen] = useAtom(showAccountModalAtom);
  const [, setError] = useAtom(errorAtom);
  const [, setCurrentChatInfo] = useAtom(chatInfoAtom)

  // State
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [chatLog, setChatLogState] = useState<ChatLog[]>([]);

  // Mutations
  const { mutateAsync: createChat } = useCreateChat();
  const { mutateAsync: addChatLog } = useAddChatLog();
  const { mutateAsync: addMessages } = useAddMessages();
  const { mutateAsync: addVariable } = useAddVariable();
  const { mutateAsync: updateChatTitle } = useUpdateChatTitle();

  // Queries
  const { data: chats, refetch: fetchChats } = useChats();

  // Helpers
  const updateUserFiles = useUpdateUserFiles();

  const setChatLog = (chatLog: ChatLog[]) => {
    // If the most recent message is the user's goal,
    // append an informative message from Evo
    if (chatLog.length !== 0 && chatLog[chatLog.length - 1].user === "user") {
      setChatLogState([
        ...chatLog, {
        user: "evo",
        title: "Reviewing your prompt..."
      }]);
    } else {
      setChatLogState(chatLog);
    }
  }

  const handleChatIdChange = async (chatId: string | undefined) => {
    const currentThread = evoService.current;

    if (currentThread && currentThread.chatId === chatId) {
      return;
    }

    evoService.disconnect();

    const config: EvoThreadConfig = {
      chatId: chatId || "<anon>",
      loadChatLog,
      loadWorkspace,
      onChatLogAdded: handleChatLogAdded,
      onMessagesAdded: handleMessagesAdded,
      onVariableSet: handleVariableSet
    };
    const callbacks: EvoThreadCallbacks = {
      setIsRunning,
      setChatLog,
      setWorkspace,
      onGoalCapReached: () => {
        setCapReached(true);
        setAccountModalOpen(true);
      },
      onError: (error: string) => {
        console.error(error);
        setError("Failed to start Evo.");
      },
    };
    await evoService.connect(config, callbacks);
  }

  const loadChatLog = async (chatId: string) => {
    if (chatId === "<anon>") {
      return [];
    }

    const { data: chats, error } = await fetchChats();

    if (error) {
      console.error(error);
      setError("Failed to fetch user chats.");
      return [];
    }

    const currentChat = chats?.find(c => c.id === chatId);

    if (!currentChat) {
      return [];
    }

    return currentChat.logs;
  }

  const loadWorkspace = async (chatId: string) => {
    if (isAuthenticated) {
      return new SupabaseWorkspace(chatId, supabase.storage)
    } else {
      return new InMemoryWorkspace()
    }
  }

  const setWorkspace = async (workspace: Workspace) => {
    setUserWorkspace(workspace);
    await updateUserFiles(workspace);
  }

  const handleChatLogAdded = async (log: ChatLog) => {
    if (!isAuthenticated || !chatId) {
      return;
    }
    await addChatLog({ chatId, log });
  }

  const handleMessagesAdded = async (type: ChatLogType, messages: ChatMessage[]) => {
    if (!isAuthenticated || !chatId) {
      return;
    }
    await addMessages({
      chatId,
      messages,
      type
    })
  };

  const handleVariableSet = async (key: string, value: string) => {
    if (!isAuthenticated || !chatId) {
      return;
    }
    await addVariable({
      chatId,
      key,
      value
    });
  }

  const handleStart = async (goal: string) => {
    if (isStarting) {
      return;
    }

    setIsStarting(true);

    if (isAuthenticated) {
      // Create a ChatID
      if (!chatId) {
        chatId = uuid();
        await createChat(chatId);
        await handleChatIdChange(chatId);
        onCreateChat(chatId);
      }

      const currentChat = chats?.find((chat) => chat.id === chatId)
      if (!currentChat || !currentChat?.title) {
        ChatApi.generateTitle(chatId, goal).then(async (title) => {
          if (title && chatId) {
            await updateChatTitle({ chatId, title });
            setCurrentChatInfo({ name: title });
          }
        });
      }
    }

    setChatLog([
      ...chatLog, {
      user: "user",
      title: goal
    }]);

    // Tell the EvoService to start the goal
    evoService.start({
      goal,
      allowTelemetry,
      openAiApiKey
    });
    setIsStarting(false);
  }

  useEffect(() => {
    handleChatIdChange(chatId);
  }, [chatId]);

  return {
    logs: chatLog,
    isStarting,
    isRunning,
    handleStart
  };
}
