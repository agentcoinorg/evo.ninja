import React, {
  useEffect,
  useState,
  PropsWithChildren,
  MouseEvent,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { useDropzone } from "react-dropzone";
import { readFile } from "@/lib/sys/file";
import { InMemoryFile } from "@nerfzael/memory-fs";
import { downloadFilesAsZip } from "@/lib/sys/file/downloadFilesAsZip";
import clsx from "clsx";
import IconButton from "./IconButton";
import FileIcon from "./FileIcon";

interface UploadProps {
  className?: string;
  userFiles: InMemoryFile[];
  onUploadFiles: (files: InMemoryFile[]) => void;
}

function CurrentWorkspace({
  userFiles,
  onUploadFiles,
  ...props
}: PropsWithChildren<UploadProps>) {
  const { className } = props;
  const [showUpload, setShowUpload] = useState(false);
  const { acceptedFiles, getRootProps, getInputProps, isDragAccept, open } =
    useDropzone({ noClick: true });

  function downloadUserFiles(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    downloadFilesAsZip("workspace.zip", userFiles);
  }

  function getFileType(path: InMemoryFile["path"]) {
    const index = path.lastIndexOf(".");
    return path.substring(index + 1);
  }

  useEffect(() => {
    (async () => {
      if (acceptedFiles && acceptedFiles.length) {
        const result = await Promise.all(
          acceptedFiles.map(async (x) => {
            return await readFile(x);
          })
        );

        onUploadFiles(result);

        setShowUpload(false);
      }
    })();
  }, [acceptedFiles, onUploadFiles]);

  return (
    <div className="h-full p-2">
      <div
        {...getRootProps({
          className: clsx(
            "dropzone overflow-y group relative flex h-full min-h-[300px] cursor-pointer flex-col space-y-1 rounded-lg border-2 border-solid border-zinc-900 p-[6px] transition-colors duration-100 ease-in-out hover:border-dashed hover:border-cyan-500 hover:bg-zinc-950",
            {
              "!border-dashed !border-cyan-800 !bg-zinc-950 hover:!border-cyan-500":
                isDragAccept,
            },
            className
          ),
          onClick: open,
        })}
      >
        <div className="flex w-full items-center justify-between space-x-1 p-1">
          <div className="text-xs uppercase tracking-widest text-zinc-500">
            Current Workspace
          </div>
          <div className="flex items-center space-x-1">
            <IconButton iconName="FilePlus" iconProps={{ size: 18 }} />
            {userFiles.length !== 0 && (
              <IconButton
                className="text-zinc-500 hover:text-cyan-500"
                iconName="DownloadSimple"
                iconProps={{ size: 18 }}
                onClick={(event) => downloadUserFiles(event)}
              />
            )}
          </div>
        </div>
        {userFiles.map((file, i) => {
          return (
            <div className="flex w-full cursor-pointer items-center space-x-2 rounded p-1 text-cyan-500 transition-colors duration-300 hover:bg-zinc-800 hover:text-white">
              <FileIcon fileType={getFileType(file.path)} />
              <div key={i}>{file.path}</div>
            </div>
          );
        })}
        <div className="animate-fade-in pointer-events-none absolute left-1/2 top-1/2 z-10 hidden w-8/12 -translate-x-1/2 -translate-y-1/2 transform rounded-lg bg-zinc-900/50 p-3 text-center text-xs opacity-0 shadow-md backdrop-blur-sm group-hover:block">
          <input {...getInputProps()} />
          <p>
            Drag &quot;n&quot; drop the build folder here, or click to select
            the files
          </p>
        </div>
      </div>
    </div>
  );
}

export default CurrentWorkspace;
