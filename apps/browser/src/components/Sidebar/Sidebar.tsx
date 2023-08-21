import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCog, faUpload } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css'

const Sidebar = () => {
  return (
    <div className="Sidebar">
      <img src="avatar.png" alt="Main Logo" className="Logo" />
      <div className="Scripts">
        <h3>SCRIPTS</h3>
        <div className="Script">Script 1</div>
        <div className="Script">Script 2</div>
        {/* More scripts */}
      </div>
      <div className="Workspace">
        <h3>WORKSPACE</h3>
        <div className="File">File 1</div>
        <div className="File">File 2</div>
        {/* More files */}

        <button className="UploadButton" title="Upload files">
          <FontAwesomeIcon icon={faUpload} /> Upload files
        </button>
      </div>
      <img src="polywrap-logo.png" alt="Image Banner" className="ImageBanner" />
      <footer className="Footer">
        <FontAwesomeIcon icon={faCog} />
        <FontAwesomeIcon icon={faTwitter} />
        <FontAwesomeIcon icon={faDiscord} />
        <FontAwesomeIcon icon={faGithub} />
      </footer>
    </div>
  );
}


export default Sidebar;