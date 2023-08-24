import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTwitter,
  faDiscord,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
import { faCog, faDownload, faUpload } from "@fortawesome/free-solid-svg-icons";
import { faUserNinja, faFolder } from "@fortawesome/free-solid-svg-icons";
import Upload from "../Upload";
import File from "../File/File";

import "./Sidebar.css";
import { downloadFilesAsZip } from "../../sys/file/downloadFilesAsZip";
import { InMemoryFile } from "@nerfzael/memory-fs";

export interface SidebarProps {
  onSettingsClick: () => void;
  scripts: InMemoryFile[];
  userFiles: InMemoryFile[];
  uploadUserFiles: (files: InMemoryFile[]) => void;
  deleteUserFile: (file: InMemoryFile) => void;
}

const Sidebar = ({ onSettingsClick, scripts, userFiles, uploadUserFiles, deleteUserFile }: SidebarProps) => {
  const groupFilesByName = (files: InMemoryFile[]) => {
    return files.reduce((acc, file) => {
      if (file.path === '.msgs') {
        acc[file.path] = [file];
      } else {
        const fileNameWithoutExt = file.path.split('.').slice(0, -1).join('.');
        acc[fileNameWithoutExt] = acc[fileNameWithoutExt] || [];
        acc[fileNameWithoutExt].push(file);
      }
      return acc;
    }, {} as { [name: string]: InMemoryFile[] });
  };
  
  const scriptsGrouped = groupFilesByName(
    scripts.filter((file) => !file.path.startsWith("agent."))
  );  

  const userFilesGrouped = groupFilesByName(userFiles);

  function downloadUserFiles() {
    downloadFilesAsZip("workspace.zip", userFiles);
  }

  return (
    <div className="Sidebar">
      <div className="Content">
        <img src="avatar-name.png" alt="Main Logo" className="Logo" />
        <div className="Scripts">
        <h3>
            <FontAwesomeIcon icon={faUserNinja} /> SCRIPTS
          </h3>
          {Object.keys(scriptsGrouped).map((name, i) => (
            <File key={i} files={scriptsGrouped[name]} showExtension={false} />
          ))}
        </div>
        <Upload className="Workspace" onUpload={uploadUserFiles}>
          <h3>
            <FontAwesomeIcon icon={faFolder} style={{ marginRight: "10px" }} /> WORKSPACE
          </h3>
          <div>
          {userFiles.map((file, i) => (
            <div key={i} className="file-wrapper">
              <File files={[file]} showExtension={true} deleteFile={deleteUserFile} />
            </div>
          ))}
          </div> 
          {
            userFiles.length !== 0 && (
              <button 
                className="DownloadButton" 
                title="Download" 
                onClick={downloadUserFiles}>
                <FontAwesomeIcon icon={faDownload} />  Download
              </button>
            )
          }
        </Upload>
        <footer className="Footer">
          <div className="Polywrap">
            <span className="BuiltWithLove">Built with love by</span>
            <a
              href="https://polywrap.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="polywrap-logo.png"
                alt="Image Banner"
                className="ImageBanner"
              />
            </a>
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
