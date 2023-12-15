import React from "react";
import { useAtom } from "jotai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import Upload from "./Upload";
import File from "./File";
import { uploadedFilesAtom, userFilesAtom } from "@/lib/store";
import { useDownloadWorkspaceAsZip } from "@/lib/hooks/useDownloadWorkspaceAsZip";

export default function UserWorkspace() {
  const [, setUploadedFiles] = useAtom(uploadedFilesAtom);
  const [userFiles] = useAtom(userFilesAtom);
  const downloadUserWorkspace = useDownloadWorkspaceAsZip();

  return (
    <Upload
      className="flex h-auto max-h-96 w-full flex-col justify-between overflow-y-auto rounded border border-neutral-500 bg-neutral-900 p-4 text-neutral-50"
      onUploadFiles={setUploadedFiles}
    >
      <h3 className="text-lg font-semibold">
        <FontAwesomeIcon icon={faFolder} style={{ marginRight: "10px" }} />{" "}
        WORKSPACE
      </h3>
      <div>
        {userFiles.map((file, i) => (
          <File key={i} file={file} />
        ))}
      </div>
      {userFiles.length !== 0 && (
        <button
          className="my-4 inline-block h-9 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-500"
          title="Download"
          onClick={downloadUserWorkspace}
        >
          <FontAwesomeIcon icon={faDownload} /> Download
        </button>
      )}
    </Upload>
  );
}
