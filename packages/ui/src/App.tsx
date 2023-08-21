import React from 'react';

import * as EvoNinja from "@evo-ninja/core";

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
  return (
    <div className="App">
      <Sidebar/>
      <Chat/>
    </div>
  );
}

export default App;
