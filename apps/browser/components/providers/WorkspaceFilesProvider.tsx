import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { uploadedFilesAtom, userWorkspaceAtom } from "@/lib/store";
import { useAtom } from "jotai";
import { useEffect } from "react";

export default function WorkspaceFilesProvider({ children }: { children: React.ReactNode }) {
  const [uploadedFiles] = useAtom(uploadedFilesAtom);
  const [userWorkspace] = useAtom(userWorkspaceAtom);
  const checkForUserFiles = useCheckForUserFiles()

  useEffect(() => {
    if (!userWorkspace) {
      return;
    }

    for (const file of uploadedFiles) {
      userWorkspace.writeFileSync(
        file.path,
        new TextDecoder().decode(file.content)
      );
    }

    checkForUserFiles();
  }, [uploadedFiles]);

  return (
    <>
      {children}
    </>
  )
}