import { useAtom } from "jotai";
import { useEffect } from "react";
import { uploadedFilesAtom } from "../store";
import { Workspace } from "@evo-ninja/agent-utils";
import { useUpdateUserFiles } from "./useUpdateUserFiles";

export const useWatchForFileUploads = (
  chatId: string | undefined,
  createChatIdIfNeccessary: (chatId: string | undefined) => Promise<string | undefined>,
  loadWorkspace: (chatId: string) => Workspace
) => {
  const [uploadedFiles, setUploadedFiles] = useAtom(uploadedFilesAtom);
  const updateUserFiles = useUpdateUserFiles();

  useEffect(() => {
    (async () => {
      if (uploadedFiles.length === 0) {
        return;
      }

      const decoder = new TextDecoder();
      const files = [...uploadedFiles];
      setUploadedFiles([]);

      const userWorkspace = await loadWorkspace(await createChatIdIfNeccessary(chatId) || "<anon>");
      // Write all uploaded files
      await Promise.all(
        files.map((file) => userWorkspace.writeFile(
          file.path,
          decoder.decode(file.content)
        )
        )
      );
      await updateUserFiles(userWorkspace);
    })();
  }, [uploadedFiles]);
};
