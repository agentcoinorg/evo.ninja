import { uploadedFilesAtom, userWorkspaceAtom } from "@/lib/store";
import { useUpdateUserFiles } from "@/lib/hooks/useUpdateUserFiles";
import { useAtom } from "jotai";
import { useEffect } from "react";

export default function WorkspaceFilesProvider({ children }: { children: React.ReactNode }) {
  const [uploadedFiles, setUploadedFiles] = useAtom(uploadedFilesAtom);
  const [userWorkspace] = useAtom(userWorkspaceAtom);
  const updateUserFiles = useUpdateUserFiles();

  useEffect(() => {
    //eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      if (uploadedFiles.length === 0) {
        return;
      }

      const decoder = new TextDecoder();
      const files = [...uploadedFiles];
      setUploadedFiles([]);

      // Write all uploaded files
      await Promise.all(
        files.map((file) =>
          userWorkspace.writeFile(
            file.path,
            decoder.decode(file.content)
          )
        )
      );
      await updateUserFiles(userWorkspace);
    })();
  }, [uploadedFiles]);

  return (
    <>
      {children}
    </>
  )
}