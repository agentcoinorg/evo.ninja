import { InMemoryFile } from "@nerfzael/memory-fs";

export const readFile = (file: File): Promise<InMemoryFile> => {
  return new Promise<InMemoryFile>((resolve, _) => {
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      const text = e.target?.result;
      const content = !text ? undefined :
        typeof text === "string" ? (new TextEncoder()).encode(text) :
        new Uint8Array(text);
      resolve(new InMemoryFile(
        (file as unknown as { path: string }).path,
        content,
      ));
    };

    reader.readAsArrayBuffer(file);
  });
};
