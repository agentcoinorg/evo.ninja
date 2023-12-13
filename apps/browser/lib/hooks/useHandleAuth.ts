import { useAtom } from "jotai";
import { useState } from "react";
import {
  allowTelemetryAtom,
  capReachedAtom,
  localOpenAiApiKeyAtom,
  signInModalAtom,
} from "../store";
import { useSession } from "next-auth/react";
import { AuthProxy } from "../api/AuthProxy";

export function useHandleAuth() {
  const [awaitingAuth, setAwaitingAuth] = useState<boolean>(false);
  const [, setSignInModal] = useAtom(signInModalAtom);

  const [allowTelemetry] = useAtom(allowTelemetryAtom);
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [, setCapReached] = useAtom(capReachedAtom);

  const { data: session } = useSession();

  const firstTimeUser = !localOpenAiApiKey && !session?.user;

  const handlePromptAuth = async (
    message: string,
    chatId: string | undefined
  ): Promise<{
    complete: boolean;
    goalId?: string;
  }> => {
    if (awaitingAuth) {
      return { complete: false };
    }

    if (firstTimeUser) {
      setSignInModal(true);
      return { complete: false };
    }

    const subsidize = !localOpenAiApiKey;

    setAwaitingAuth(true);
    const goalId = await AuthProxy.checkGoal(
      chatId,
      allowTelemetry ? message : "<redacted>",
      subsidize,
      () => {
        setCapReached(true);
      }
    );
    setAwaitingAuth(false);

    if (!goalId) {
      return { complete: false };
    }

    return {
      complete: true,
      goalId: goalId
    };
  };
  return {
    handlePromptAuth,
    awaitingAuth,
  };
}
