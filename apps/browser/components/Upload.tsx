import React, { useEffect, PropsWithChildren } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { useDropzone } from "react-dropzone";
import { readFile } from '@/lib/sys/file';
import { InMemoryFile } from '@nerfzael/memory-fs';
import clsx from 'clsx';

interface UploadProps {
  className?: string
  onUploadFiles: (files: InMemoryFile[]) => void
}

function Upload({ className, onUploadFiles, children }: PropsWithChildren<UploadProps>) {
  const { acceptedFiles, getRootProps, getInputProps, isDragAccept, open } =
    useDropzone({ noClick: true });

  useEffect(() => {
    (async () => {
      if (acceptedFiles && acceptedFiles.length) {
        const result = await Promise.all(
          acceptedFiles.map(async (x) => {
            return await readFile(x);
          })
        );

        onUploadFiles(result);
      }
    })();
  }, [acceptedFiles, onUploadFiles]);

  return (
    <div
      {...getRootProps({
        className: clsx(
          'dropzone',
          isDragAccept ? " border-2 border-dashed border-blue-200 bg-neutral-50" : "",
          className
        ),
      })}
    >
      <>
        {children}
        <>
        <input {...getInputProps()} />
        <button 
          className="my-4 inline-block h-9 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-500" 
          title="Upload files" 
          onClick={open}>
          <FontAwesomeIcon icon={faUpload} /> Upload
        </button>
        </>
      </>
    </div>
  );
}

export default Upload;
