import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import "./File.css";

type FileType = {
  path: string;
  content?: Uint8Array;
};

const File = ({ files, showExtension, deleteFile, editFile }: { files: FileType[]; showExtension: boolean; deleteFile?: (file: FileType) => void; editFile?: (file: FileType, newContent: string) => void }) => {
  const [showContent, setShowContent] = useState(false);
  const [editableContent, setEditableContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [isModified, setIsModified] = useState(false);

  const handleClick = () => {
    if (savedContent) {
      setEditableContent(savedContent);
    } else {
      let contentString = "";
      files.forEach((file) => {
        if (file.content) {
          const decoder = new TextDecoder();
          contentString += decoder.decode(file.content);
        }
      });
      setEditableContent(contentString);
    }
    setIsModified(false);
    setShowContent(true);
  };

  const handleClose = () => {
    setShowContent(false);
  };

  const handleDelete = (file: FileType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this file?')) {
      deleteFile?.(file);
    }
  };

  const handleEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableContent(e.target.value);
    setIsModified(true);
  };

  const handleSave = () => {
    if (window.confirm('Are you sure you want to save changes?')) {
      setSavedContent(editableContent);
      editFile?.(files[0], editableContent);
      setIsModified(false);
    }
  };

  return (
    <>
      <div className="File" onClick={handleClick}>
        <span>
          {showExtension ? files[0].path : files[0].path === '.msgs' ? '.msgs' : files[0].path.split('.').slice(0, -1).join('.')}
        </span>
        {deleteFile && (
          <button className="delete-button" onClick={(e) => handleDelete(files[0], e)}>X</button>
        )}
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
        <textarea value={editableContent} onChange={handleEdit} style={{ width: '100%', height: '400px' }} />
        {isModified && (
          <button className="File__Btn" onClick={handleSave}>
            Save
          </button>
        )}
      </Modal>
    </>
  );
};

export default File;
