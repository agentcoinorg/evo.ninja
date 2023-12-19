import { InMemoryWorkspace, Workspace } from "@evo-ninja/agent-utils";
import { InMemoryFile } from "@nerfzael/memory-fs";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { EvoService } from "@/lib/services/evo/EvoService";

export const localOpenAiApiKeyAtom = atomWithStorage<string | undefined>(
  "openai-api-key",
  undefined
);
export const allowTelemetryAtom = atomWithStorage("allow-telemetry", false);
export const showDisclaimerAtom = atomWithStorage("show-disclaimer", true);
export const welcomeModalAtom = atom<boolean>(false);
export const signInModalAtom = atom<boolean>(false);
export const settingsModalAtom = atom<boolean>(false);
export const capReachedAtom = atom<boolean>(false)
export const errorAtom = atom<string | undefined>(undefined)
export const showAccountModalAtom = atom<boolean>(false);
export const userFilesAtom = atom<InMemoryFile[]>([]);
export const uploadedFilesAtom = atom<InMemoryFile[]>([]);
export const userWorkspaceAtom = atom<Workspace>(new InMemoryWorkspace());
export const sidebarAtom = atom<boolean>(true)
export const chatIdAtom = atom<string | "<anon>" | undefined>("<anon>")
export const evoServiceAtom = atom<EvoService>(new EvoService("<anon>"));
