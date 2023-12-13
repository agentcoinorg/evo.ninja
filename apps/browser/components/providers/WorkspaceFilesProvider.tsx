import { useCheckForEvoWorkspaceFiles } from "@/lib/hooks/useCheckForEvoWorkspaceFiles";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { chatIdAtom, uploadedFilesAtom, userWorkspaceAtom } from "@/lib/store";
import { InMemoryWorkspace, Workspace } from "@evo-ninja/agent-utils";
import { useAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function WorkspaceFilesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status: sessionStatus } = useSession();
  const [uploadedFiles] = useAtom(uploadedFilesAtom);
  const [userWorkspace, setUserWorkspace] = useAtom(userWorkspaceAtom);
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
    (async () => {
      if (!uploadedFiles.length) {
        return;
      }

      if (userWorkspace) {
        await onUploadFiles(userWorkspace);
      } else {
        if (sessionStatus === "authenticated") {
          if (!chatId) {
            const { workspace } = await createChat();
            await onUploadFiles(workspace);
            return;
          }
        } else {
          const workspace = new InMemoryWorkspace();
          setUserWorkspace(workspace);
          await onUploadFiles(workspace);
        }
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
