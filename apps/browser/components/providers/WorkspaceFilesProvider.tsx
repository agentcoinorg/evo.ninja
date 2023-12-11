import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { uploadedFilesAtom, userWorkspaceAtom } from "@/lib/store";
import { useAtom } from "jotai";
import { useEffect } from "react";

export default function WorkspaceFilesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [uploadedFiles] = useAtom(uploadedFilesAtom);
  const [userWorkspace] = useAtom(userWorkspaceAtom);
  const checkForUserFiles = useCheckForUserFiles();

  useEffect(() => {
    if (!userWorkspace) {
      return;
    }

    //eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      await Promise.all(
        uploadedFiles.map(
          async (file) =>
            await userWorkspace.writeFile(
              file.path,
              new TextDecoder().decode(file.content)
            )
        )
      );
      await checkForUserFiles();
    })();
  }, [uploadedFiles, userWorkspace]);

  // useEffect(() => {
  //   (async () => {
  //     if (userWorkspace) {
  //       await checkForUserFiles()
  //     }
  //   })()
  // }, [userWorkspace])

  return <>{children}</>;
}