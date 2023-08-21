import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTwitter,
  faDiscord,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
import { faCog, faUpload } from "@fortawesome/free-solid-svg-icons";
import { faUserNinja, faFolder } from "@fortawesome/free-solid-svg-icons";
import Upload from "../Upload";
import File from "../File/File";

import "./Sidebar.css";
import { InMemoryFile } from "../../sys/file";

export interface SidebarProps {
  onSettingsClick: () => void;
  scripts: InMemoryFile[];
  userFiles: InMemoryFile[];
  uploadUserFiles: (files: InMemoryFile[]) => void;
}

const Sidebar = ({ onSettingsClick, scripts, userFiles, uploadUserFiles }: SidebarProps) => {
  return (
    <div className="Sidebar">
      <div className="Content">
        <img src="avatar-name.png" alt="Main Logo" className="Logo" />
        <div className="Scripts">
          <h3>
            <FontAwesomeIcon icon={faUserNinja} /> SCRIPTS
          </h3>
          {scripts.map((file, i) => (
            <div className="Script" key={i}>
              {file.path}
            </div>
          ))}
        </div>
        <Upload className="Workspace" onUpload={uploadUserFiles}>
          <h3>
            <FontAwesomeIcon icon={faFolder} />
            Workspace
          </h3>
          {userFiles.map((file, i) => (
            <File file={file} />
          ))}
        </Upload>
        <footer className="Footer">
          <div className="Polywrap">
            <span className="BuiltWithLove">Built with love by</span>
            <img
              src="polywrap-logo.png"
              alt="Image Banner"
              className="ImageBanner"
            />
          </div>
          <div className="Footer__Links">
            <a
              href="https://twitter.com/evo_ninja_ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faTwitter} />
            </a>
            <a
              href="https://discord.polywrap.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faDiscord} />
            </a>
            <a
              href="https://github.com/polywrap/evo.ninja"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon={faGithub} />
            </a>
            <a onClick={onSettingsClick}>
              <FontAwesomeIcon icon={faCog} />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Sidebar;
