import { useAtom } from "jotai";
import { userFilesAtom } from "../store";
import { downloadFilesAsZip } from "../sys/file/downloadFilesAsZip";

export const useDownloadFilesAsZip = () => {
  const [userFiles] = useAtom(userFilesAtom);
  
  return async () => {
    await downloadFilesAsZip("workspace.zip", userFiles);
  }
}