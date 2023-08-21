import React, { useState } from "react";
import Modal from "react-modal";
import "./File.css";

type FileType = {
  path: string;
  content?: Uint8Array;
};

const File = ({ file }: { file: FileType }) => {
  const [showContent, setShowContent] = useState(false);

  const handleClick = () => {
    setShowContent(true);
  };

  const handleClose = () => {
    setShowContent(false);
  };

  let contentString = "";
  if (file.content) {
    const decoder = new TextDecoder();
    contentString = decoder.decode(file.content);
  }

  return (
    <>
      <div className="File" onClick={handleClick}>
        {file.path}
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
