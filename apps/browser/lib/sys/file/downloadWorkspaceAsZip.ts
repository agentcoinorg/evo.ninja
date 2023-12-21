import JSZip from "jszip";
import FileSaver from "file-saver";
import path from "path-browserify";
import { Workspace } from "@evo-ninja/agent-utils";
import { InMemoryFile, InMemoryPackageReader } from "@nerfzael/memory-fs";

const zipPackage = async (
  path: string,
  zip: JSZip,
  reader: InMemoryPackageReader
): Promise<JSZip> => {
  for (const itemPath of await reader.readDir(path)) {
    const absolutePath = `${path}/${itemPath}`;
    const stats = await reader.getStats(absolutePath);

    if (stats.isFile) {
      const fileContent = await reader.readFile(absolutePath);
      zip.file(itemPath, fileContent);
    } else {
      let dir = zip.folder(itemPath) as JSZip;
      dir = await zipPackage(absolutePath, dir, reader);
    }
  }

  return zip;
};

const readWorkspaceFiles = async (
  workspace: Workspace,
  subpath: string
): Promise<InMemoryFile[]> => {
  const files: InMemoryFile[] = [];
  const encoder = new TextEncoder();
  const entries = await workspace.readdir(subpath);
  for (const entry of entries) {
    const newPath = path.join(subpath, entry.name);
    if (entry.type === "directory") {
      files.push(...await readWorkspaceFiles(
        workspace,
        newPath
      ));
    } else {
      files.push(new InMemoryFile(
        newPath,
        encoder.encode(await workspace.readFile(newPath))
      ));
    }
  }
  return files;
}

export const downloadWorkspaceAsZip = async (
  zipName: string,
  workspace: Workspace
): Promise<void> => {
  const reader = new InMemoryPackageReader(
    await readWorkspaceFiles(workspace, "./")
  );
  const zip = await zipPackage(".", new JSZip(), reader);

  await zip.generateAsync({ type: "blob" }).then((content: Blob) => {
    FileSaver.saveAs(content, zipName);
  });
};
