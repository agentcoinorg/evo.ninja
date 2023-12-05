import React, {
  useEffect,
  useState,
  PropsWithChildren,
  MouseEvent,
} from "react";
import { useDropzone } from "react-dropzone";
import { readFile } from "@/lib/sys/file";
import { InMemoryFile } from "@nerfzael/memory-fs";
import { downloadFilesAsZip } from "@/lib/sys/file/downloadFilesAsZip";
import clsx from "clsx";
import IconButton from "./IconButton";
import FileIcon from "./FileIcon";
import colors from "tailwindcss/colors";
import { FilePlus } from "@phosphor-icons/react";

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

  function downloadUserFiles() {
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
    <div className="p-2">
      <div className="flex w-full items-center justify-between space-x-1 px-2">
        <div className="text-xs uppercase tracking-widest text-zinc-500">
          Current Workspace
        </div>
        <div className="flex items-center space-x-1">
          <IconButton
            iconName="FilePlus"
            iconProps={{ size: 18 }}
            onClick={open}
          />
          {userFiles.length !== 0 && (
            <IconButton
              buttonClassName="text-zinc-500 hover:text-cyan-500"
              iconName="DownloadSimple"
              iconProps={{ size: 18 }}
              onClick={downloadUserFiles}
            />
          )}
        </div>
      </div>
      <div className="relative h-[300px]">
        {userFiles.length === 0 ? (
          <div
            className="mt-1 flex cursor-pointer flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed border-zinc-500 p-7 text-center transition-colors duration-300 hover:border-cyan-500 hover:bg-zinc-950 hover:text-cyan-500"
            onClick={open}
          >
            <FilePlus size={24} className="text-[currentColor]" />
            <p className="leading-regular text-xs text-zinc-500">
              You currently have no files in your workspace. Drop or click here
              to add them.
            </p>
          </div>
        ) : (
          <>
            <div
              {...getRootProps({
                className: clsx(
                  "dropzone group h-full cursor-pointer space-y-1 overflow-y-auto rounded-lg border-2 border-solid border-zinc-900 p-[6px] transition-all duration-100 ease-in-out",
                  {
                    "!border-dashed !border-cyan-500 !bg-zinc-950":
                      isDragAccept,
                  },
                  className
                ),
              })}
            >
              {userFiles.map((file, i) => {
                return (
                  <div
                    className={clsx(
                      "flex w-full cursor-pointer items-center space-x-2 rounded p-1 text-cyan-500 transition-colors duration-300",
                      { "hover:bg-zinc-800 hover:text-white": isDragAccept }
                    )}
                  >
                    <FileIcon fileType={getFileType(file.path)} />
                    <div key={i}>{file.path}</div>
                  </div>
                );
              })}
            </div>
            {isDragAccept && (
              <div className="animate-fade-in pointer-events-none absolute left-1/2 top-1/2 z-10 w-8/12 -translate-x-1/2 -translate-y-1/2 transform rounded-lg bg-zinc-900/80 p-3 text-center text-xs opacity-0 shadow-md backdrop-blur group-hover:block">
                <input {...getInputProps()} />
                <p>
                  Drag &quot;n&quot; drop the build folder here, or click to
                  select the files
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CurrentWorkspace;
