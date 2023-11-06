import React, { useState } from "react";
import Modal from "react-modal";

type FileType = {
  path: string;
  content?: Uint8Array;
};

const File = ({ files, showExtension }: { files: FileType[]; showExtension: boolean }) => {
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
      <div className="flex items-center justify-between cursor-pointer my-2.5 p-2.5 w-auto rounded border-2 border-neutral-500 bg-neutral-900 hover:bg-orange-700" onClick={handleClick}>
      {showExtension ? files[0].path : files[0].path.split('.').slice(0, -1).join('.')}
      </div>
      <Modal
        className="fixed left-1/2 top-1/2 box-border inline-block h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 overflow-y-scroll break-words break-all border-2 border-neutral-700 bg-neutral-900 p-8 text-neutral-100 outline-none"
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
        <button className="inline-block h-12 w-24 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-700" onClick={handleClose}>
          Close
        </button>
        <pre>{contentString}</pre>
      </Modal>
    </>
  );
};

export default File;
