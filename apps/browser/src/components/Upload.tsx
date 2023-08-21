import React, { useEffect, useState, PropsWithChildren } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { useDropzone } from "react-dropzone";
import { InMemoryFile, readFile } from '../sys/file';
import '../App.css';

interface UploadProps {
  className: string,
  onUpload: (files: InMemoryFile[]) => void
}

function Upload({ className, onUpload, children }: PropsWithChildren<UploadProps>) {
  const [showUpload, setShowUpload] = useState(false);
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

      onUpload(result);

      setShowUpload(false);
    }
  })();
  }, [acceptedFiles, onUpload]);

  const dropHover = isDragAccept ? " drop-hover" : "";

  return (
    <div className={className}>
      <div
          {...getRootProps({
            className: `dropzone ${dropHover}`,
          })}
        >
          {(isDragAccept || showUpload) && (
            <div className="inner-dropzone">
              <input {...getInputProps()} />
              <p>
                Drag &quot;n&quot; drop the build folder here, or click to
                select the files
              </p>
            </div>
          )}
          {!isDragAccept && !showUpload && (
            <>
              <div>
                <div>
                  {children}
                </div>
                  <button 
                    className="UploadButton" 
                    title="Upload files" 
                    onClick={open}>
                    <FontAwesomeIcon icon={faUpload} /> Upload files
                  </button>
              </div>
            </>
          )}
      </div>
    </div>
  );
}

export default Upload;
