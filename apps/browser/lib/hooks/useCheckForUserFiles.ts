import { userFilesAtom, userWorkspaceAtom } from "../store";
import { updateWorkspaceFiles } from "../updateWorkspaceFiles";

import { useAtom } from "jotai";

export const useCheckForUserFiles = () => {
  const [userFiles, setUserFiles] = useAtom(userFilesAtom);
  const [userWorkspace] = useAtom(userWorkspaceAtom);

  return async () => {
    if (!userWorkspace) {
      return;
    }
    await updateWorkspaceFiles(userWorkspace, userFiles, setUserFiles);
  };
};
