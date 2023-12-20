import { workspaceUploadsAtom } from "@/lib/store";
import { useWorkspaceFilesUpdate } from "@/lib/hooks/useWorkspaceFilesUpdate";
import { useAtom } from "jotai";
import { Workspace } from "@evo-ninja/agent-utils";
import { InMemoryFile } from "@nerfzael/memory-fs";

export const useWorkspaceUploadUpdate = () => {
  const [workspaceUploads, setWorkspaceUploads] = useAtom(workspaceUploadsAtom);
  const workspaceFilesUpdate = useWorkspaceFilesUpdate();

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
    await workspaceFilesUpdate(workspace);
  }
}
