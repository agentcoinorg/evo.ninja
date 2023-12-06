import { useAtom } from "jotai";
import { userFilesAtom, userWorkspaceAtom } from "../store";
import { updateWorkspaceFiles } from "../updateWorkspaceFiles";

export const useCheckForUserFiles = () => {
  const [userFiles, setUserFiles] = useAtom(userFilesAtom);
  const [userWorkspace] = useAtom(userWorkspaceAtom);
  
  return () => {
    if (!userWorkspace) {
      return;
    }
    updateWorkspaceFiles(userWorkspace, userFiles, setUserFiles);
  }
}