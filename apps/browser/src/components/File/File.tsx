import React, { useState } from "react";
import Modal from "react-modal";
import "./File.css";

type FileType = {
  path: string;
  content?: Uint8Array;
};

const File = ({ files }: { files: FileType[] }) => {
  const [showContent, setShowContent] = useState(false);

  const handleClick = () => {
    setShowContent(true);
  };

  const handleClose = () => {
    setShowContent(false);
  };
  
  let contentString = "";
  files.forEach((file) => {
    if (file.content) {
      const decoder = new TextDecoder();
      contentString += `${file.path}:\n${decoder.decode(file.content)}\n--------\n`;
    }
  });
  
  

  
  return (
    <>
      <div className="File" onClick={handleClick}>
        {files[0].path === '.msgs' ? '.msgs' : files[0].path.split('.').slice(0, -1).join('.')}
      </div>
      <Modal
        className="File__Modal"
        isOpen={showContent}
        onRequestClose={handleClose}
        contentLabel="File Content"
        style={{
          overlay: {
            backgroundColor: "transparent",
            backdropFilter: "blur(8px)",
          },
        }}
      >
        <button className="File__Btn" onClick={handleClose}>
          Close
        </button>
        <pre>{contentString}</pre>
      </Modal>
    </>
  );
};

export default File;
