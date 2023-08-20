import React, { useEffect, useState } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { useDropzone } from "react-dropzone";
import { InMemoryFile, readFile } from './file';
import { PropsWithChildren } from 'react'

interface FooProps {
  className: string,
  onUpload: (files: InMemoryFile[]) => void
}

function UploadContainer(props: PropsWithChildren<FooProps>) {
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

      props.onUpload(result);

      setShowUpload(false);
    }
  })();
  }, [acceptedFiles, props]);

  const dropHover = isDragAccept ? " drop-hover" : "";

  return (
    <div className={props.className}>
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
                  {props.children}
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

export default UploadContainer;
