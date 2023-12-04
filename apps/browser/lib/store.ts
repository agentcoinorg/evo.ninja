import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const localOpenAiApiKeyAtom = atomWithStorage<string | null>(
  "openai-api-key",
  null
);
export const allowTelemetryAtom = atomWithStorage("allow-telemetry", false);
export const welcomeModalAtom = atomWithStorage("welcome-modal-seen", false);
export const showDisclaimerAtom = atomWithStorage("show-disclaimer", true);
export const capReachedAtom = atom<boolean>(false)