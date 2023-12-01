import { Workspace } from "@evo-ninja/agent-utils";
import { InMemoryFile } from "@nerfzael/memory-fs";

export async function updateWorkspaceFiles(
  workspace: Workspace,
  files: InMemoryFile[],
  setFiles: (files: InMemoryFile[]) => void
): Promise<void> {
  const items = await workspace.readdir("");
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
      if (
        items[i].name !== files[i].path ||
        new TextEncoder().encode(await workspace.readFile(items[i].name)) !==
          files[i].content
      ) {
        isDifferent = true;
        break;
      }
    }
  }

  if (isDifferent) {
    let contents: string[] = [];

    for (const item of items) {
      contents.push(await workspace.readFile(item.name));
    }

    setFiles(
      items.map(
        (x, i) =>
          new InMemoryFile(x.name, new TextEncoder().encode(contents[i]) || "")
      )
    );
  }
}
