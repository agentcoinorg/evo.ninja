import {
  allowTelemetryAtom,
  capReachedAtom,
  evoServiceAtom,
  localOpenAiApiKeyAtom,
  showAccountModalAtom,
  userWorkspaceAtom,
  errorAtom
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
import { useState, useEffect, useRef } from "react";
import { Workspace, InMemoryWorkspace } from "@evo-ninja/agent-utils";
import { ChatLogType, ChatMessage } from "@evo-ninja/agents";
import { SupabaseWorkspace } from "../supabase/SupabaseWorkspace";
import { useSupabaseClient } from "../supabase/useSupabaseClient";

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

  // State
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [chatLog, setChatLog] = useState<ChatLog[]>([]);

  // Mutations
  const { mutateAsync: createChat } = useCreateChat();
  const { mutateAsync: addChatLog } = useAddChatLog();
  const { mutateAsync: addMessages } = useAddMessages();
  const { mutateAsync: addVariable } = useAddVariable();

  // Queries
  const { refetch: fetchChats } = useChats();

  // Helpers
  const updateUserFiles = useUpdateUserFiles();

  const handleChatIdChange = (chatId: string | undefined) => {
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
    console.log("Connecting EvoService...");
    console.log(config);
    evoService.connect(config, callbacks);
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
    return new SupabaseWorkspace(chatId, supabase.storage)
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
        handleChatIdChange(chatId);
        onCreateChat(chatId);
      }
    }

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
