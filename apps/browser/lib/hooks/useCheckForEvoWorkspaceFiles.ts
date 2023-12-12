import { Workspace } from "@evo-ninja/agent-utils";
import { userFilesAtom, userWorkspaceAtom } from "../store";
import { updateWorkspaceFiles } from "../updateWorkspaceFiles";

import { useAtom } from "jotai";

export const useCheckForEvoWorkspaceFiles = (
  workspace?: Workspace
): (() => Promise<void>) => {
  const [userFiles, setUserFiles] = useAtom(userFilesAtom);
  const [userWorkspace] = useAtom(userWorkspaceAtom);

  return async () => {
    if (!userWorkspace) {
      return;
    }
    await updateWorkspaceFiles(
      workspace ?? userWorkspace,
      userFiles,
      setUserFiles
    );
  };
};