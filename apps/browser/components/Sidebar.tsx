import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDiscord,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
import { faUser, faDownload } from "@fortawesome/free-solid-svg-icons";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import Upload from "./Upload";
import File from "./File";

import { downloadFilesAsZip } from "@/lib/sys/file/downloadFilesAsZip";
import { InMemoryFile } from "@nerfzael/memory-fs";
import CloseIcon from "./CloseIcon";
import SidebarIcon from "./SidebarIcon";

export interface SidebarProps {
  onSettingsClick: () => void;
  userFiles: InMemoryFile[];
  onUploadFiles: (files: InMemoryFile[]) => void;
  onSidebarToggleClick: () => void;
}

const Sidebar = ({
  onSettingsClick,
  userFiles,
  onUploadFiles,
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
        <div className="flex items-center gap-3 w-full">
          <div className="flex flex-1 justify-center h-14 items-center rounded border border-neutral-500 p-3 text-lg text-white gap-4 cursor-pointer hover:opacity-100 opacity-80 transition-all" onClick={onSettingsClick}>
            <FontAwesomeIcon icon={faUser} />
            Account
          </div>
          <div className="rounded border border-neutral-500 h-14 p-4 text-lg text-white gap-4 cursor-pointer hover:opacity-100 opacity-80 transition-all" onClick={onSidebarToggleClick}>
            <SidebarIcon />
          </div>
        </div>

        <Upload
          className="flex h-auto max-h-96 w-full flex-col justify-between overflow-y-auto rounded border border-neutral-500 bg-neutral-900 p-4 text-neutral-50"
          onUploadFiles={onUploadFiles}
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
              className="my-4 inline-block h-9 cursor-pointer rounded-xl border-none bg-orange-600 px-6 py-2.5 text-center text-neutral-900 shadow-md outline-none transition-all hover:bg-orange-500"
              title="Download"
              onClick={downloadUserFiles}
            >
              <FontAwesomeIcon icon={faDownload} /> Download
            </button>
          )}
        </Upload>
      </div>
        <div className="box-border flex justify-center w-10/12 flex-col gap-2">
          <div className="flex justify-center">
            <img className="max-w-[16rem]" src="avatar-name.png" alt="Main Logo" />
          </div>
          <div className="flex justify-center text-lg text-white gap-4">
            <a
              className="cursor-pointer opacity-80 transition-all hover:opacity-100"
              href="https://discord.gg/r3rwh69cCa"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faDiscord} title="Support & Feedback" />
            </a>
            <div className="pointer-events-none">|</div>
            <a
              className="cursor-pointer opacity-80 transition-all hover:opacity-100"
              href="https://github.com/polywrap/evo.ninja"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faGithub} title="Star us on GitHub" />
            </a>
          </div>
        </div>
    </div>
  );
};

export default Sidebar;
