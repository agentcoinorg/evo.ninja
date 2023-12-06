import { useAtom } from "jotai";
import { useState } from "react";
import {
  allowTelemetryAtom,
  capReachedAtom,
  localOpenAiApiKeyAtom,
  proxyEmbeddingAtom,
  proxyLlmAtom,
} from "../store";
import { useSession } from "next-auth/react";
import { AuthProxy } from "../api/AuthProxy";

export function useHandleAuth() {
  const [awaitingAuth, setAwaitingAuth] = useState<boolean>(false);
  const [, setAccountModalOpen] = useState(false);

  const [allowTelemetry] = useAtom(allowTelemetryAtom);
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [, setCapReached] = useAtom(capReachedAtom);
  const [proxyLlmApi] = useAtom(proxyLlmAtom);
  const [proxyEmbeddingApi] = useAtom(proxyEmbeddingAtom);

  const { data: session } = useSession();

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

    proxyLlmApi?.setGoalId(goalId);
    proxyEmbeddingApi?.setGoalId(goalId);
    return true;
  };
  return {
    handlePromptAuth,
    awaitingAuth,
  };
}
