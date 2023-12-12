import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { chatIdAtom, uploadedFilesAtom, userWorkspaceAtom } from "@/lib/store";
import { useAtom } from "jotai";
import { useEffect } from "react";

export default function WorkspaceFilesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [uploadedFiles] = useAtom(uploadedFilesAtom);
  const [userWorkspace] = useAtom(userWorkspaceAtom);
  const [chatId] = useAtom(chatIdAtom);
  const checkForUserFiles = useCheckForUserFiles();
  const createChat = useCreateChat();

  useEffect(() => {
    //eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      if (uploadedFiles.length !== 0) {
        console.log("Uploading...");
        if (!chatId) {
          await createChat();
        }
      }

      if (!userWorkspace) {
        return;
      }

      await Promise.all(
        uploadedFiles.map((file) =>
          userWorkspace.writeFile(
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