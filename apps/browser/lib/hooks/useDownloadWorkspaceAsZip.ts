import { useAtom } from "jotai";
import { workspaceAtom } from "../store";
import { downloadWorkspaceAsZip } from "../sys/file/downloadWorkspaceAsZip";

export const useDownloadWorkspaceAsZip = () => {
  const [workspace] = useAtom(workspaceAtom);

  return async () => {
    if (!workspace) {
      return;
    }
    await downloadWorkspaceAsZip("workspace.zip", workspace);
  }
}
