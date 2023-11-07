import { InMemoryFile } from "@nerfzael/memory-fs";

export const readFile = (file: File): Promise<InMemoryFile> => {
  return new Promise<InMemoryFile>((resolve, _) => {
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      const text = e.target?.result;
      resolve({
        path: (file as unknown as { path: string }).path,
        content: text,
      } as InMemoryFile);
    };

    reader.readAsArrayBuffer(file);
  });
};
