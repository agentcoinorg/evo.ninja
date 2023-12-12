import { useCheckForEvoWorkspaceFiles } from "@/lib/hooks/useCheckForEvoWorkspaceFiles";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { chatIdAtom, uploadedFilesAtom, userWorkspaceAtom } from "@/lib/store";
import { Workspace } from "@evo-ninja/agent-utils";
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
  const checkForEvoWorkspaceFiles = useCheckForEvoWorkspaceFiles();
  const createChat = useCreateChat();

  const onUploadFiles = async (workspace: Workspace) => {
    await Promise.all(
      uploadedFiles.map((file) =>
        workspace.writeFile(file.path, new TextDecoder().decode(file.content))
      )
    );
    await checkForEvoWorkspaceFiles();
  };

  useEffect(() => {
    //eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      if (uploadedFiles.length !== 0) {
        console.log("Uploading...");
        if (!chatId) {
          const { workspace } = await createChat();
          await onUploadFiles(workspace);
          return;
        }
      }

      if (userWorkspace) {
        await onUploadFiles(userWorkspace);
      }
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
