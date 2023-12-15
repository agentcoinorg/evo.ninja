import { useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { InMemoryFile } from "@nerfzael/memory-fs";
import { readFile } from "../sys/file";
import { useAtom } from "jotai";
import { uploadedFilesAtom } from "../store";


export function useUploadFiles() {
  const [, setUploadedFiles] = useAtom(uploadedFilesAtom);

  const { acceptedFiles, getRootProps, getInputProps, isDragAccept, open } = useDropzone({ noClick: true });

  useEffect(() => {
    (async () => {
      if (acceptedFiles && acceptedFiles.length) {
        const result = await Promise.all(
          acceptedFiles.map(async (x) => {
            return await readFile(x);
          })
        );

        setUploadedFiles(result);
      }
    })();
  }, [acceptedFiles, setUploadedFiles]);

  return {
    getRootProps, getInputProps, isDragAccept, open
  }
}
