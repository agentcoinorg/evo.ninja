import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  localOpenAiApiKeyAtom,
  allowTelemetryAtom,
  capReachedAtom,
} from "../store";

import { LlmModel } from "@evo-ninja/agents";
import OpenAi from "openai";
import AccountConfig from "@/components/modals/AccountConfig";
import { useSession } from "next-auth/react";

const checkLlmModel = async (
  apiKey: string,
  currentModel: LlmModel
): Promise<void> => {
  const openai = new OpenAi({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
  const models = await openai.models.list();
  const supportCurrentModel = models.data.some((m) => m.id === currentModel);
  if (!supportCurrentModel) {
    throw new Error("Model not supported");
  }
};

const validateOpenAiApiKey = async (
  openAiApiKey: string
): Promise<string | void> => {
  try {
    // Make sure that given api key has access to GPT-4
    await checkLlmModel(openAiApiKey, "gpt-4-1106-preview");
  } catch (e: any) {
    if (e.message.includes("Incorrect API key provided")) {
      throw new Error(
        "Open AI API key is not correct. Please make sure it has the correct format"
      );
    }

    if (e.message.includes("Model not supported")) {
      throw new Error(
        "You API Key does not support GPT-4. Make sure to enable billing"
      );
    }

    throw new Error("Error validating OpenAI API Key");
  }
};

export function useAccountConfig({ onClose }: { onClose: () => void }) {
  const [localApiKey, setLocalApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [allowTelemetry, setAllowTelemetry] = useAtom(allowTelemetryAtom);
  const [apiKey, setApiKey] = useState<string>(localApiKey || "");
  const [telemetry, setTelemetry] = useState(allowTelemetry);
  const [error, setError] = useState<string | undefined>();
  const [capReached, setCapReached] = useAtom(capReachedAtom);
  const { data: session } = useSession();

  useEffect(() => {
    if (!apiKey && localApiKey) {
      setApiKey(localApiKey)
    }
  }, [localApiKey])

  useEffect(() => {
    setTelemetry(allowTelemetry)
  }, [allowTelemetry])

  const onSave = async () => {
    if (apiKey) {
      try {
        await validateOpenAiApiKey(apiKey);
        setLocalApiKey(apiKey);
        if (capReached) {
          setCapReached(false);
        }
      } catch (e: any) {
        setError(e.message);
        return;
      }
    } else {
      setLocalApiKey(null);
    }
    setAllowTelemetry(telemetry);
    onClose();
  };

  return {
    onSave,
    AccountConfig: AccountConfig({
      apiKey,
      telemetry,
      setTelemetry,
      setApiKey,
      error,
      isLoggedIn: !!session?.user.email,
    }),
    firstTimeUser: !!session?.user.email && !localApiKey
  };
}
