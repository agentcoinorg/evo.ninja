import { buildEvo } from "./buildEvo";
import { useRunEvo } from "./useRunEvo";

import { useEffect, useRef, useState } from "react";
import { Evo, ChatMessage, ChatLogType } from "@evo-ninja/agents";
import { useAtom } from "jotai";

import { ChatLog } from "@/components/Chat";
import {
  capReachedAtom,
  proxyEmbeddingAtom,
  proxyLlmAtom,
  localOpenAiApiKeyAtom,
  userWorkspaceAtom,
} from "@/lib/store";

interface UseEvoArgs {
  onChatLog: (message: ChatLog) => Promise<void>;
  onMessagesAdded: (
    type: ChatLogType,
    messages: ChatMessage[]
  ) => Promise<void>;
  onVariableSet: (key: string, value: string) => Promise<void>;
  goal: string | undefined;
}

export function useEvo({
  onChatLog,
  onMessagesAdded,
  onVariableSet,
  goal,
}: UseEvoArgs): {
  isRunning: boolean;
  error?: string;
  start: (message: string) => void;
  onContinue: () => void;
  onPause: () => void;
  isPaused: boolean;
  isStopped: boolean;
  isSending: boolean;
  setIsSending: (sending: boolean) => void;
} {
  const [error, setError] = useState<string | undefined>();
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const evoRef = useRef<Evo | undefined>();
  const [, setLlmProxyApi] = useAtom(proxyLlmAtom);
  const [, setEmbeddingProxyApi] = useAtom(proxyEmbeddingAtom);

  const [, setCapReached] = useAtom(capReachedAtom);
  const [userWorkspace] = useAtom(userWorkspaceAtom);

  const {
    isRunning,
    onPause,
    start,
    onContinue,
    isPaused,
    isSending,
    isStopped,
    setIsSending,
    setIterator,
  } = useRunEvo(evoRef.current, onChatLog);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      if (!userWorkspace || !isRunning || !goal) {
        return;
      }
      console.log("Creating EVOOO");

      try {
        const evo = await buildEvo(
          onChatLog,
          onMessagesAdded,
          onVariableSet,
          setCapReached,
          setLlmProxyApi,
          setEmbeddingProxyApi,
          localOpenAiApiKey,
          userWorkspace
        );
        console.log("EVOOOX", evo);
        evoRef.current = evo;
        setIterator(evo.run({ goal }));
      } catch (e: any) {
        setError(e.message);
        console.error("EEErROR", e);
      }
    })();
  }, [localOpenAiApiKey, userWorkspace, isRunning, goal, setIterator]);

  return {
    isRunning,
    onPause,
    start,
    error,
    onContinue,
    isPaused,
    isSending,
    isStopped,
    setIsSending,
  };
}
