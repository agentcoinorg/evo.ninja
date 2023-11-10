import React, { useState } from "react";
import Modal from "react-modal";

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
    contentString += `${file.path}:\n${decoder.decode(
      file.content
    )}\n--------\n`;
  }
  return (
    <>
      <div
        className="my-2.5 flex w-auto cursor-pointer items-center justify-between rounded border-2 border-neutral-500 bg-neutral-900 p-2.5 hover:border-orange-600"
        onClick={handleClick}
      >
        {file.path}
      </div>
      <Modal
        className="fixed left-1/2 top-1/2 box-border inline-block h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 overflow-y-scroll break-words break-all border-2 border-neutral-600 bg-neutral-900 p-8 text-neutral-100 outline-none"
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
        <button
          className="inline-block h-12 w-24 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-500"
          onClick={handleClose}
        >
          Close
        </button>
        <pre>{contentString}</pre>
      </Modal>
    </>
  );
};

export default File;
