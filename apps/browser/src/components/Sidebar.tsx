import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDiscord,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
import { faCog, faDownload } from "@fortawesome/free-solid-svg-icons";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import Upload from "./Upload";
import File from "./File";

import { downloadFilesAsZip } from "../sys/file/downloadFilesAsZip";
import { InMemoryFile } from "@nerfzael/memory-fs";
import CloseIcon from "./CloseIcon";

export interface SidebarProps {
  onSettingsClick: () => void;
  userFiles: InMemoryFile[];
  uploadUserFiles: (files: InMemoryFile[]) => void;
  onSidebarToggleClick: () => void;
}

const Sidebar = ({
  onSettingsClick,
  userFiles,
  uploadUserFiles,
  onSidebarToggleClick,
}: SidebarProps) => {
  function downloadUserFiles() {
    downloadFilesAsZip("workspace.zip", userFiles);
  }

  return (
    <div className="box-border flex h-full w-full flex-col items-center overflow-auto bg-opacity-black p-4 justify-between">
      <div className="flex h-auto w-full flex-col items-center gap-4">
        <div className="flex w-full justify-end lg:hidden">
          <div
            className="flex cursor-pointer gap-2"
            onClick={onSidebarToggleClick}
          >
            <span>Close menu</span>
            <CloseIcon></CloseIcon>
          </div>
        </div>
        <img
          src="avatar-name.png"
          alt="Main Logo"
          className="mb-5 w-full max-w-sm"
        />

        <Upload
          className="flex h-auto max-h-96 w-full flex-col justify-between overflow-y-auto rounded border border-neutral-500 bg-neutral-900 p-4 text-neutral-50"
          onUpload={uploadUserFiles}
        >
          <h3 className="text-lg font-semibold">
            <FontAwesomeIcon icon={faFolder} style={{ marginRight: "10px" }} />{" "}
            WORKSPACE
          </h3>
          <div>
            {userFiles.map((file, i) => (
              <File key={i} file={file}  />
            ))}
          </div>
          {userFiles.length !== 0 && (
            <button
              className="my-4 inline-block h-9 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-700"
              title="Download"
              onClick={downloadUserFiles}
            >
              <FontAwesomeIcon icon={faDownload} /> Download
            </button>
          )}
        </Upload>
      </div>
      <footer className="my-8 box-border flex w-10/12 flex-col gap-4">
        <div className="flex flex-col items-center gap-2">
          <span className="text-neutral-50">Built with love by</span>
          <a
            className="text-white"
            href="https://polywrap.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="polywrap-logo.png"
              alt="Image Banner"
              className="w-full max-w-[250px]"
            />
          </a>
        </div>
        <div className="flex justify-between text-lg text-white">
          <a
            className="cursor-pointer opacity-80 transition-all hover:opacity-100"
            href="https://discord.gg/r3rwh69cCa"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faDiscord} />
          </a>
          <a
            className="cursor-pointer opacity-80 transition-all hover:opacity-100"
            href="https://github.com/polywrap/evo.ninja"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faGithub} />
          </a>
          <a
            className="cursor-pointer opacity-80 transition-all hover:opacity-100"
            onClick={onSettingsClick}
          >
            <FontAwesomeIcon icon={faCog} />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Sidebar;
