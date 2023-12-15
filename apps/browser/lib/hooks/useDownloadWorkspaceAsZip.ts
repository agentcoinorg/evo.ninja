import { useAtom } from "jotai";
import { userWorkspaceAtom } from "../store";
import { downloadWorkspaceAsZip } from "../sys/file/downloadWorkspaceAsZip";

export const useDownloadWorkspaceAsZip = () => {
  const [userWorkspace] = useAtom(userWorkspaceAtom);

  return async () => {
    await downloadWorkspaceAsZip("workspace.zip", userWorkspace);
  }
}
