import { localOpenAiApiKeyAtom, welcomeModalAtom, workspaceUploadsAtom } from "@/lib/store";
import { readFile } from "@/lib/sys/file";
import { useDropzone } from "react-dropzone";
import { useAtom } from "jotai";
import { InMemoryFile } from "@nerfzael/memory-fs";
import { useSession } from "next-auth/react";

export function useWorkspaceUploadDrop(onUpload: (uploads: InMemoryFile[]) => void) {
  const [workspaceUploads, setWorkspaceUploads] = useAtom(workspaceUploadsAtom);
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom)
  const [,setWelcomeModalOpen] = useAtom(welcomeModalAtom)
  const { status } = useSession()

  const firstTimeUser = !localOpenAiApiKey && status !== "authenticated"

  const { getRootProps, getInputProps, isDragAccept, open } = useDropzone({
    noClick: true,
    onDropAccepted: (acceptedFiles) => {
      if (firstTimeUser) {
        setWelcomeModalOpen(true)
        return
      }
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
