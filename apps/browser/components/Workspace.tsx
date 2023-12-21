import React, { useState } from "react";
import { InMemoryFile } from "@nerfzael/memory-fs";
import clsx from "clsx";

import FileIcon from "./FileIcon";
import FileModal from "./modals/FileModal";
import { DownloadSimple, FilePlus } from "@phosphor-icons/react";
import Button from "./Button";
import { useWorkspaceUploadDrop } from "@/lib/hooks/useWorkspaceUploadDrop";
import { useAtom } from "jotai";
import { workspaceFilesAtom, workspaceUploadsAtom } from "@/lib/store";
import { useDownloadWorkspaceAsZip } from "@/lib/hooks/useDownloadWorkspaceAsZip";

export interface WorkspaceProps {
  onUpload: (uploads: InMemoryFile[]) => void;
}

function Workspace({ onUpload }: WorkspaceProps) {
  const { getRootProps, getInputProps, isDragAccept, open } =
    useWorkspaceUploadDrop(onUpload);
  const [workspaceFiles] = useAtom(workspaceFilesAtom);
  const [workspaceUploads] = useAtom(workspaceUploadsAtom);
  const downloadFilesAsZip = useDownloadWorkspaceAsZip();
  const [showFile, setShowFile] = useState<InMemoryFile | null>(null);
  const [showFileModal, setShowFileModal] = useState<boolean>(false);

  function getFileType(path: InMemoryFile["path"]) {
    const index = path.lastIndexOf(".");
    return path.substring(index + 1);
  }

  const workspaceLoading = workspaceUploads.length > 0;

  const handleFileClick = (file: InMemoryFile | null) => {
    setShowFile(file);
    setShowFileModal(true);
  };

  return (
    <div className="p-2">
      <div className="flex w-full items-center justify-between space-x-1 px-2">
        <div className="text-xs uppercase tracking-widest text-zinc-500">
          Current Workspace
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="icon" onClick={open}>
            <FilePlus size={18} weight="bold" />
          </Button>
          <input {...getInputProps()} />
          {workspaceFiles.length !== 0 && (
            <Button
              variant="icon"
              className="text-zinc-500 hover:text-cyan-500"
              onClick={downloadFilesAsZip}
            >
              <DownloadSimple size={18} weight="bold" />
            </Button>
          )}
        </div>
      </div>
      <div className="relative h-full max-h-[24vh] overflow-y-auto">
        {workspaceLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-black/10 border-l-cyan-600" />
          </div>
        ) : (
          <>
            {workspaceFiles.length === 0 ? (
              <div
                className="mt-1 flex cursor-pointer flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed border-zinc-500 p-7 text-center transition-colors duration-300 hover:border-cyan-500 hover:bg-zinc-950 hover:text-cyan-500"
                onClick={open}
              >
                <FilePlus size={24} className="text-[currentColor]" />
                <p className="leading-regular text-xs text-zinc-500">
                  You currently have no files in your workspace. Drop or click
                  here to add them.
                </p>
              </div>
            ) : (
              <>
                <div
                  {...getRootProps({
                    className: clsx(
                      "dropzone group h-full space-y-1 overflow-y-auto rounded-lg border-2 border-solid border-zinc-900 p-[6px] transition-all duration-100 ease-in-out",
                      {
                        "cursor-pointer !border-dashed !border-cyan-500 !bg-zinc-950":
                          isDragAccept,
                      }
                    ),
                  })}
                >
                  {workspaceFiles.map((file, i) => {
                    return (
                      <div
                        key={i}
                        onClick={() => handleFileClick(file)}
                        className={clsx(
                          "flex w-full cursor-pointer items-center space-x-2 rounded p-1 text-sm text-cyan-500 transition-colors duration-300",
                          {
                            "hover:bg-zinc-800 hover:text-white": !isDragAccept,
                          }
                        )}
                      >
                        <FileIcon fileType={getFileType(file.path)} />
                        <div className="w-full overflow-x-hidden text-ellipsis whitespace-nowrap">
                          {file.path}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <FileModal
        isOpen={showFileModal}
        onClose={() => setShowFileModal(false)}
        file={showFile}
      />
    </div>
  );
}

export default Workspace;
