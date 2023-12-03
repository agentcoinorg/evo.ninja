import { atom } from "jotai";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useEffect } from "react";
import { allowTelemetryAtom, dojoAtom, localOpenAiApiKeyAtom } from "../store";

export interface DojoConfig {
  openAiApiKey: string | null;
  allowTelemetry: boolean;
  model: string
}

export interface Dojo {
  config: DojoConfig;
  error?: string;
}

export function useDojo() {
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [allowTelemetry] = useAtom(allowTelemetryAtom);
  const [dojo, setDojo] = useAtom(dojoAtom);

  useEffect(() => {
    setDojo({
      config: {
        ...dojo.config,
        openAiApiKey: localOpenAiApiKey,
      },
    });
  }, [localOpenAiApiKey]);

  useEffect(() => {
    setDojo({
      config: {
        ...dojo.config,
        allowTelemetry,
      },
    });
  }, [allowTelemetry]);

  const setDojoError = (error: string) => {
    setDojo({
      config: dojo.config,
      error,
    });
  };

  return { dojo, setDojo, setDojoError };
}
