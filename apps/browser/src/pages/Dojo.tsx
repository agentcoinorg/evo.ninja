import React, { useState, useEffect } from 'react';

import * as EvoCore from "@evo-ninja/core";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";

import './Dojo.css';

import DojoConfig from "../components/DojoConfig/DojoConfig";
import Sidebar from "../components/Sidebar/Sidebar";
import Chat from "../components/Chat/Chat";

type Message = {
  text: string;
  user: string;
};

function Dojo() {
  const [apiKey, setApiKey] = useState<string | null>(
    localStorage.getItem("openai-api-key")
  );
  const [configOpen, setConfigOpen] = useState(false);
  const [evo, setEvo] = useState<EvoCore.Evo | undefined>(undefined);

  const onConfigSaved = (apiKey: string) => {
    if (!apiKey) {
      localStorage.removeItem("openai-api-key");
      setApiKey(null);
      setConfigOpen(true);
    } else {
      localStorage.setItem("openai-api-key", apiKey);
      setConfigOpen(false);
      setApiKey(apiKey);
    }
  }

  const createEvo = useEffect(() => {
    if (!apiKey) {
      return;
    }

    const scriptsWorkspace = new EvoCore.InMemoryWorkspace();
    const scripts = new EvoCore.Scripts(
      scriptsWorkspace
    );
    const env = new EvoCore.Env(
      {
        "OPENAI_API_KEY": apiKey,
        "GPT_MODEL": "gpt-4-0613",
        "CONTEXT_WINDOW_TOKENS": "8000",
        "MAX_RESPONSE_TOKENS": "2000"
      }
    );
    const logger = new EvoCore.Logger([
      new EvoCore.ConsoleLogger()
    ], {
      promptUser: () => Promise.resolve("N/A"),
      logUserPrompt: () => {}
    })
    const llm = new EvoCore.OpenAI(
      env.OPENAI_API_KEY,
      env.GPT_MODEL,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger
    );
    const userWorkspace = new EvoCore.InMemoryWorkspace();
    const chat = new EvoCore.Chat(
      userWorkspace,
      llm,
      cl100k_base,
      logger
    );

    setEvo(new EvoCore.Evo(
      userWorkspace,
      scripts,
      llm,
      chat,
      logger
    ));
  }, [apiKey])

  return (
    <div className="Dojo">
      {(!apiKey || configOpen) &&
        <DojoConfig
          apiKey={apiKey}
          onConfigSaved={onConfigSaved}
        />
      }
      <Sidebar onSettingsClick={() => setConfigOpen(true)} />
      {evo && <Chat evo={evo} />}
    </div>
  );
}

export default Dojo;
