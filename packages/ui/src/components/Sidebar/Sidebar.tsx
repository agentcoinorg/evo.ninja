import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCog, faUpload } from '@fortawesome/free-solid-svg-icons';
import { faUserNinja, faFolder } from '@fortawesome/free-solid-svg-icons';

import './Sidebar.css'

const Sidebar = () => {
  return (
    <div className="Sidebar">
      <img src="avatar.png" alt="Main Logo" className="Logo" />
      <div className="Content">
        <div className="Scripts">
          <h3><FontAwesomeIcon icon={faUserNinja} /> SCRIPTS</h3>
          <div className="Script">Script 1</div>
          <div className="Script">Script 2</div>
        </div>
        <div className="Workspace">
          <h3><FontAwesomeIcon icon={faFolder} /> WORKSPACE</h3>
          <div className="File">File 1</div>
          <div className="File">File 2</div>
          <button className="UploadButton"><FontAwesomeIcon icon={faUpload} /> Upload files</button>
        </div>
      </div>
      <span className="BuiltWithLove">Built with love by</span>
      <img src="polywrap-logo.png" alt="Image Banner" className="ImageBanner" />
      <footer className="Footer">
        <a href="https://twitter.com/evo_ninja_ai" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faTwitter} /></a>
        <a href="https://discord.polywrap.io" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faDiscord} /></a>
        <a href="https://github.com/polywrap/evo.ninja" target="_blank" rel="noopener noreferrer"><FontAwesomeIcon icon={faGithub} /></a>
        <a><FontAwesomeIcon icon={faCog} /></a>
      </footer>
    </div>
  );
}

export default Sidebar;