import React from 'react';

import * as EvoNinja from "@evo-ninja/core";

import './Dojo.css';

import Sidebar from '../components/Sidebar/Sidebar'
import Chat from '../components/Chat/Chat'

// import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";

type Message = {
  text: string;
  user: string;
};

const workspace = new EvoNinja.InMemoryWorkspace();

function Dojo() {
  return (
    <div className="Dojo">
      <Sidebar/>
      <Chat/>
    </div>
  );
}

export default Dojo;
