import React, { useState } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCog, faUpload } from '@fortawesome/free-solid-svg-icons';
import Sidebar from './components/Sidebar/Sidebar'
import Chat from './components/Chat/Chat'


type Message = {
  text: string;
  user: string;
};

function App() {
  // const [messages, setMessages] = useState<Message[]>([]);
  // const [input, setInput] = useState('');

  // const gibberishResponse = () => {
  //   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  //   let result = '';
  //   for (let i = 0; i < 15; i++) {
  //     result += characters.charAt(Math.floor(Math.random() * characters.length));
  //   }
  //   return result;
  // };

  // const sendMessage = () => {
  //   setMessages([...messages, { text: input, user: 'user' }]);
  //   setInput('');
  //   setTimeout(() => {
  //     setMessages([...messages, { text: input, user: 'user' }, { text: gibberishResponse(), user: 'evo' }]);
  //   }, 1000); // Simulating a delay for the EVO response
  // };

  return (
    <div className="App">
      <Sidebar/>
      <Chat/>
      {/* <div className="Chat">
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
        </div> */}
      {/* </div> */}
    </div>
  );
}

export default App;
