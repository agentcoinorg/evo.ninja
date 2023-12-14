import { useAtom } from "jotai";
import { Workspace } from "@evo-ninja/agent-utils";
import { userFilesAtom, userWorkspaceAtom } from "../store";
import { updateWorkspaceFiles } from "../updateWorkspaceFiles";

export const useCheckForUserFiles = (workspace: Workspace | undefined) => {
  const [userFiles, setUserFiles] = useAtom(userFilesAtom);

  return async () => {
    if (!workspace) {
      return;
    }
    await updateWorkspaceFiles(workspace, userFiles, setUserFiles);
  }
}