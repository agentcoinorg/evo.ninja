import { workspaceUploadsAtom } from "@/lib/store";
import { readFile } from "@/lib/sys/file";
import { useDropzone } from "react-dropzone";
import { useAtom } from "jotai";
import { InMemoryFile } from "@nerfzael/memory-fs";

export function useWorkspaceUploadDrop(onUpload: (uploads: InMemoryFile[]) => void) {
  const [workspaceUploads, setWorkspaceUploads] = useAtom(workspaceUploadsAtom);

  const { getRootProps, getInputProps, isDragAccept, open } = useDropzone({
    noClick: true,
    onDropAccepted: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length) {
        Promise.all(
          acceptedFiles.map(async (x) => {
            return await readFile(x);
          })
        ).then((files) => {
          const uploads = [
            ...workspaceUploads,
            ...files
          ];
          setWorkspaceUploads(uploads);
          onUpload(uploads);
        });
      }
    }
  });

  return {
    getRootProps, getInputProps, isDragAccept, open
  }
}
