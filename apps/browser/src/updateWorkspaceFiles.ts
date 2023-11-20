import { Workspace } from "@evo-ninja/agent-utils";
import { InMemoryFile } from "@nerfzael/memory-fs";

export function updateWorkspaceFiles(workspace: Workspace, files: InMemoryFile[], setFiles: (files: InMemoryFile[]) => void): void {
  const items = workspace.readdirSync("");
  if (!items) {
    return;
  }

  // Compare workspace files to files
  // If different, update files
  let isDifferent = false;
  if (items.length !== files.length) {
    isDifferent = true;
  } else {
    for (let i = 0; i < items.length; i++) {
      if (items[i].name !== files[i].path || new TextEncoder().encode(workspace.readFileSync(items[i].name)) !== files[i].content) {
        isDifferent = true;
        break;
      }
    }
  }

  if (isDifferent) {
    setFiles(items.map(x => new InMemoryFile(x.name, new TextEncoder().encode(workspace.readFileSync(x.name)) || "")));
  }
}
