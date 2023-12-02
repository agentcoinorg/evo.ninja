import { atom } from "jotai";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useEffect } from "react";

export interface DojoConfig {
  openAiApiKey: string | null;
  allowTelemetry: boolean;
  model: string
  // complete: boolean;
}

export interface Dojo {
  config: DojoConfig;
  error?: string;
}

export const localOpenAiApiKeyAtom = atomWithStorage<string | null>(
  "openai-api-key",
  null
);
export const allowTelemetryAtom = atomWithStorage("allow-telemetry", false);
export const welcomeModalAtom = atomWithStorage("welcome-modal-seen", false);
export const showDisclaimerAtom = atomWithStorage("show-disclaimer", true);
export const capReachedAtom = atom<boolean>(false)
export const dojoAtom = atom<Dojo>({
  config: { openAiApiKey: null, allowTelemetry: false, model: "gpt-4" },
});

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
