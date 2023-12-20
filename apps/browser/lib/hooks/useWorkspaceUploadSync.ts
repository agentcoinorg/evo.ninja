import { workspaceUploadsAtom } from "@/lib/store";
import { useWorkspaceFilesSync } from "@/lib/hooks/useWorkspaceFilesSync";
import { useAtom } from "jotai";
import { Workspace } from "@evo-ninja/agent-utils";
import { InMemoryFile } from "@nerfzael/memory-fs";

export const useWorkspaceUploadSync = () => {
  const [workspaceUploads, setWorkspaceUploads] = useAtom(workspaceUploadsAtom);
  const workspaceFilesSync = useWorkspaceFilesSync();

  return async (workspace: Workspace, uploads?: InMemoryFile[]) => {
    uploads = uploads || workspaceUploads;
    if (uploads.length === 0) {
      return;
    }

    const decoder = new TextDecoder();
    const files = [...uploads];
    setWorkspaceUploads([]);

    // Write all uploaded files
    await Promise.all(
      files.map((file) => workspace.writeFile(
        file.path,
        decoder.decode(file.content)
      ))
    );
    await workspaceFilesSync(workspace);
  }
}
