import { useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { readFile } from "../sys/file";
import { useAtom } from "jotai";
import { localOpenAiApiKeyAtom, uploadedFilesAtom, welcomeModalAtom } from "../store";
import { useSession } from "next-auth/react";


export function useUploadFiles() {
  const [, setUploadedFiles] = useAtom(uploadedFilesAtom);
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [, setWelcomeModalOpen] = useAtom(welcomeModalAtom);

  const { status } = useSession()
  const { acceptedFiles, getRootProps, getInputProps, isDragAccept, open } = useDropzone({ noClick: true });
  const firstTimeUser = !localOpenAiApiKey && status !== "authenticated"

  useEffect(() => {
    (async () => {
      if (acceptedFiles && acceptedFiles.length) {
        if (firstTimeUser) {
          setWelcomeModalOpen(true)
          return
        }
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
