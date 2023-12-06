import { useAtom } from "jotai";
import { useState } from "react";
import {
  allowTelemetryAtom,
  capReachedAtom,
  chatIdAtom,
  localOpenAiApiKeyAtom,
} from "../store";
import { useSession } from "next-auth/react";
import { useEvo } from "./useEvo";
import { AuthProxy } from "../api/AuthProxy";

export function useHandleAuth() {
  const [awaitingAuth, setAwaitingAuth] = useState<boolean>(false);
  const [, setAccountModalOpen] = useState(false);

  const [chatId, setChatId] = useAtom(chatIdAtom)
  const [allowTelemetry] = useAtom(allowTelemetryAtom);
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [, setCapReached] = useAtom(capReachedAtom);

  const { data: session } = useSession();
//   const { proxyLlmApi, proxyEmbeddingApi } = useEvo({ chatId, });

  const firstTimeUser = !localOpenAiApiKey && !session?.user;

  const handlePromptAuth = async (message: string) => {
    if (awaitingAuth) {
      return false;
    }

    if (firstTimeUser) {
      setAccountModalOpen(true);
      return false;
    }

    const subsidize = !localOpenAiApiKey;

    setAwaitingAuth(true);
    const goalId = await AuthProxy.checkGoal(
      allowTelemetry ? message : "<redacted>",
      subsidize,
      () => {
        setCapReached(true);
        setAccountModalOpen(true);
      }
    );
    setAwaitingAuth(false);

    if (!goalId) {
      return false;
    }

    // proxyLlmApi?.setGoalId(goalId);
    // proxyEmbeddingApi?.setGoalId(goalId);
    return true;
  };
  return {
    handlePromptAuth,
    awaitingAuth,
  };
}
