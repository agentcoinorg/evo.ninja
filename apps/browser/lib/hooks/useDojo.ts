import { useAtom } from "jotai";
import { useEffect } from "react";
import { allowTelemetryAtom, dojoAtom, localOpenAiApiKeyAtom } from "@/lib/store";

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
        allowTelemetry,
        openAiApiKey: localOpenAiApiKey,
      },
      error: dojo.error
    });
  }, [localOpenAiApiKey, allowTelemetry]);

  const setDojoError = (error: string) => {
    setDojo({
      config: dojo.config,
      error,
    });
  };

  return { dojo, setDojo, setDojoError };
}
