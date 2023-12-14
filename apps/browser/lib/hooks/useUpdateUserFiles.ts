import { useAtom } from "jotai";
import { Workspace } from "@evo-ninja/agent-utils";
import { InMemoryFile } from "@nerfzael/memory-fs";
import { userFilesAtom } from "@/lib/store";

export const useUpdateUserFiles = () => {
  const [, setUserFiles] = useAtom(userFilesAtom);

  return async (workspace: Workspace) => {
    const files: InMemoryFile[] = [];
    const encoder = new TextEncoder();
    const entries = await workspace.readdir("./");
    for (const entry of entries) {
      if (entry.type === "directory") {
        files.push({
          path: entry.name
        });
      } else {
        files.push({
          path: entry.name,
          content: encoder.encode(
            await workspace.readFile(entry.name)
          )
        });
      }
    }
    setUserFiles(files);
  }
}
