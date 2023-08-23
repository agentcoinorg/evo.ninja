import JSZip from "jszip";
import FileSaver from "file-saver";
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

export const downloadFilesAsZip = async (
  zipName: string,
  files: InMemoryFile[]
): Promise<void> => {
  const reader = new InMemoryPackageReader(files);
  const zip = await zipPackage(".", new JSZip(), reader);

  await zip.generateAsync({ type: "blob" }).then((content: Blob) => {
    FileSaver.saveAs(content, zipName);
  });
};
