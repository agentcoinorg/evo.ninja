import { Workspace } from "@evo-ninja/agent-utils";
import { InMemoryFile } from "@nerfzael/memory-fs";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { EvoService } from "@/lib/services/evo/EvoService";

export interface ChatInfo {
  id: string | "<anon>" | undefined;
  name: string | undefined;
}
export const chatInfoAtom = atom<ChatInfo, Partial<ChatInfo>[], ChatInfo>(
  { id: undefined, name: undefined },
  (get, set, args) => {
    const currentState: ChatInfo = get(chatInfoAtom);
    const newState: ChatInfo = set(chatInfoAtom, { ...currentState, ...args });
    return newState;
  }
);

export const localOpenAiApiKeyAtom = atomWithStorage<string | undefined>(
  "openai-api-key",
  undefined
);
export const allowTelemetryAtom = atomWithStorage("allow-telemetry", false);
export const welcomeModalAtom = atomWithStorage("welcome-modal-seen", false);
export const showDisclaimerAtom = atomWithStorage("show-disclaimer", true);
export const signInModalAtom = atom<boolean>(false);
export const capReachedAtom = atom<boolean>(false);
export const errorAtom = atom<string | undefined>(undefined);
export const showAccountModalAtom = atom<boolean>(false);
export const workspaceFilesAtom = atom<InMemoryFile[]>([]);
export const workspaceUploadsAtom = atom<InMemoryFile[]>([]);
export const workspaceAtom = atom<Workspace | undefined>(undefined);
export const sidebarAtom = atom<boolean>(true)
export const isChatLoadingAtom = atom<boolean>(false);
export const evoServiceAtom = atom<EvoService>(new EvoService("<anon>"));
export const newGoalSubmittedAtom = atom<{
  goal: string;
  chatId: string;
} | undefined>(undefined);
