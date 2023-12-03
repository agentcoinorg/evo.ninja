import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Dojo } from "./hooks/useDojo";

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