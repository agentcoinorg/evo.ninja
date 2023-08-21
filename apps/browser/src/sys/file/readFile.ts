import { InMemoryFile } from "./InMemoryFile";

export const readFile = (file: File): Promise<InMemoryFile> => {
  return new Promise<InMemoryFile>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const text = e.target.result;

      resolve({
        path: (file as any)["path"],
        content: text,
      } as InMemoryFile);
    };

    reader.readAsArrayBuffer(file);
  });
};
