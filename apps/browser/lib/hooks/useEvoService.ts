import {
  allowTelemetryAtom,
  capReachedAtom,
  evoServiceAtom,
  localOpenAiApiKeyAtom,
  settingsModalAtom,
  workspaceAtom,
  errorAtom,
} from "@/lib/store";
import { EvoThreadCallbacks, EvoThreadConfig } from "@/lib/services/evo/EvoThread";
import { useAddChatLog } from "@/lib/mutations/useAddChatLog";
import { useAddMessages } from "@/lib/mutations/useAddMessages";
import { useAddVariable } from "@/lib/mutations/useAddVariable";
import { Chat, fetchChats, useChats } from "@/lib/queries/useChats";
import { SupabaseWorkspace } from "@/lib/supabase/SupabaseWorkspace";
import { useWorkspaceFilesUpdate } from "@/lib/hooks/useWorkspaceFilesUpdate";
import { useWorkspaceUploadUpdate } from "@/lib/hooks/useWorkspaceUploadUpdate";
import { ChatLog } from "@/components/Chat";
import { Workspace, InMemoryWorkspace } from "@evo-ninja/agent-utils";
import { ChatLogType, ChatMessage } from "@evo-ninja/agents";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { EvoSupabaseClient } from "../supabase/EvoSupabaseClient";

export const useEvoService = (
  chatId: string | "<anon>" | undefined,
  isAuthenticated: boolean,
  supabase: EvoSupabaseClient | undefined
): {
  logs: ChatLog[];
  isConnected: boolean;
  isStarting: boolean;
  isRunning: boolean;
  status: string | undefined;
  handleStart: (goal: string) => Promise<void>;
} => {
  // Globals
  const [evoService] = useAtom(evoServiceAtom);
  const [allowTelemetry] = useAtom(allowTelemetryAtom);
  const [openAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [, setWorkspaceAtom] = useAtom(workspaceAtom);
  const [, setCapReached] = useAtom(capReachedAtom);
  const [, setSettingsModalOpen] = useAtom(settingsModalAtom);
  const [, setError] = useAtom(errorAtom);

  // State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [chatLog, setChatLogState] = useState<ChatLog[]>([]);
  const [status, setStatus] = useState<string | undefined>(undefined);

  // Mutations
  const { mutateAsync: addChatLog } = useAddChatLog();
  const { mutateAsync: addMessages } = useAddMessages();
  const { mutateAsync: addVariable } = useAddVariable();

  // Helpers
  const workspaceFilesUpdate = useWorkspaceFilesUpdate();
  const workspaceUploadUpdate = useWorkspaceUploadUpdate();

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
      setChatLogState([...chatLog]);
    }
  };

  const disconnectEvoService = () => {
    setIsConnected(false);
    evoService.disconnect();
  }

  const connectEvoService = async (chatId: string) => {
    const currentThread = evoService.current;

    if (currentThread && currentThread.chatId === chatId) {
      return;
    }

    disconnectEvoService();

    const config: EvoThreadConfig = {
      chatId,
      loadChat,
      loadWorkspace,
      onChatLogAdded: handleChatLogAdded,
      onMessagesAdded: handleMessagesAdded,
      onVariableSet: handleVariableSet
    };
    const callbacks: EvoThreadCallbacks = {
      setIsRunning,
      setChatLog,
      setWorkspace,
      setStatus,
      onGoalCapReached: () => {
        setCapReached(true);
        setSettingsModalOpen(true);
      },
      onError: (error: string) => {
        console.error(error);
        setError("Failed to start Evo.");
      },
    };
    await evoService.connect(config, callbacks);
    setIsConnected(true);
  };

  const loadChat = async (chatId: string): Promise<Chat> => {
    if (chatId === "<anon>") {
      return {
        id: chatId,
        created_at: new Date().toISOString(),
        title: null,
        messages: [],
        logs: [],
        variables: new Map<string, string>()
      };
    }

    const { data: chats, error } = await fetchChats(supabase!);

    if (error) {
      console.error(error);
      setError("Failed to fetch user chats.");
      throw error;
    }

    const currentChat = chats?.find(c => c.id === chatId);

    if (!currentChat) {
      throw new Error(`Chat with id ${chatId} not found.`);
    }
    return currentChat;
  };

  async function loadWorkspace(chatId: string): Promise<Workspace> {
    // isAuthenticated is only true if there's a supabase instance 
    // so we can safely assume that it's not undefined
    const workspace = isAuthenticated ?
      new SupabaseWorkspace(chatId, supabase!.storage) :
      new InMemoryWorkspace();

    await workspaceUploadUpdate(workspace);

    return workspace;
  };

  const setWorkspace = async (workspace: Workspace | undefined) => {
    setWorkspaceAtom(workspace);
    await workspaceFilesUpdate(workspace);
  };

  const handleChatLogAdded = async (log: ChatLog) => {
    if (!isAuthenticated || !chatId) {
      return;
    }
    await addChatLog({ chatId, log });
  };

  const handleMessagesAdded = async (type: ChatLogType, messages: ChatMessage[]) => {
    if (!isAuthenticated || !chatId) {
      return;
    }
    await addMessages({
      chatId,
      messages,
      type
    });
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
  };

  const handleStart = async (goal: string): Promise<void> => {
    if (isStarting) {
      return;
    }

    if (!chatId) {
      setError("Trying to start a goal without a chatId.");
      return;
    }

    setIsStarting(true);

    await connectEvoService(chatId);

    setChatLog([
      ...chatLog,
      {
        user: "user",
        title: goal
      }
    ]);

    evoService.start({
      goal,
      allowTelemetry,
      openAiApiKey
    });

    setIsStarting(false);
  };

  useEffect(() => {
    if (chatId) {
      connectEvoService(chatId);
    } else {
      if (evoService.current) {
        disconnectEvoService();
      }
    }
  }, [chatId]);

  return {
    logs: chatLog,
    isConnected,
    isStarting,
    isRunning,
    handleStart,
    status
  };
};
