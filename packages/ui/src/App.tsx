import React, { useState } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCog, faUpload } from '@fortawesome/free-solid-svg-icons';
import UploadContainer from './UploadContainer';
import { InMemoryFile } from './file';

type Message = {
  text: string;
  user: string;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const [files, setFiles] = useState<InMemoryFile[]>([]);

  function onUploadFiles(files: InMemoryFile[]) {
    console.log(files);
    setFiles(old => [...files]);
  }

  const gibberishResponse = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const sendMessage = () => {
    setMessages([...messages, { text: input, user: 'user' }]);
    setInput('');
    setTimeout(() => {
      setMessages([...messages, { text: input, user: 'user' }, { text: gibberishResponse(), user: 'evo' }]);
    }, 1000); // Simulating a delay for the EVO response
  };

  return (
    <div className="App">
      <div className="Sidebar">
        <img src="avatar.png" alt="Main Logo" className="Logo" />
        <div className="Scripts">
          <h3>Scripts</h3>
          <div className="Script">Script 1</div>
          <div className="Script">Script 2</div>
          {/* More scripts */}
        </div>
        <UploadContainer className="Workspace" onUpload={onUploadFiles}>
            <h3>Workspace</h3>
            {
              files.map((file, i) => (
                <div className="File" key={i}>{file.path}</div>
              ))
            }
        </UploadContainer>
       
        <img src="polywrap-logo.png" alt="Image Banner" className="ImageBanner" />
        <footer className="Footer">
          <FontAwesomeIcon icon={faCog} />
          <FontAwesomeIcon icon={faTwitter} />
          <FontAwesomeIcon icon={faDiscord} />
          <FontAwesomeIcon icon={faGithub} />
        </footer>
      </div>
      <div className="Chat">
        <div className="Messages">
          {messages.map((message, index) => (
            <div key={index} className={`Message ${message.user}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="SendMessage">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
