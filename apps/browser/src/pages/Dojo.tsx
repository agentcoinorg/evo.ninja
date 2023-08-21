import React, { useState, useEffect } from 'react';

import * as EvoCore from "@evo-ninja/core";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";

import './Dojo.css';

import DojoConfig from "../components/DojoConfig/DojoConfig";
import DojoError from "../components/DojoError/DojoError";
import Sidebar from "../components/Sidebar/Sidebar";
import Chat from "../components/Chat/Chat";
import { InMemoryFile } from '../file';
import { updateWorkspaceFiles } from '../updateWorkspaceFiles';

type Message = {
  text: string;
  user: string;
};

function Dojo() {
  const [apiKey, setApiKey] = useState<string | null>(
    localStorage.getItem("openai-api-key")
  );
  const [configOpen, setConfigOpen] = useState(false);
  const [dojoError, setDojoError] = useState<unknown | undefined>(undefined);
  const [evo, setEvo] = useState<EvoCore.Evo | undefined>(undefined);
  const [scripts, setScripts] = useState<InMemoryFile[]>([]);
  const [userFiles, setUserFiles] = useState<InMemoryFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<InMemoryFile[]>([]);
  const [userWorkspace, setUserWorkspace] = useState<EvoCore.InMemoryWorkspace | undefined>(undefined);
  const [scriptsWorkspace, setScriptsWorkspace] = useState<EvoCore.InMemoryWorkspace | undefined>(undefined);

  useEffect(() => {
    if (!evo || !scriptsWorkspace) {
      return;
    }

    const items = scriptsWorkspace.readdirSync("");
    if (!items) {
      return;
    }

    setScripts(items.map(x => new InMemoryFile(x, new TextEncoder().encode(scriptsWorkspace.readFileSync(x)) || "")));
  }, [scriptsWorkspace]);

  function checkForUserFiles() {
    if (!evo || !userWorkspace) {
      return;
    }
    updateWorkspaceFiles(userWorkspace, userFiles, setUserFiles);
  }

  function checkForScriptFiles() {
    if (!evo || !scriptsWorkspace) {
      return;
    }
    updateWorkspaceFiles(scriptsWorkspace, scripts, setScripts);
  }

  function onMessage() {
    checkForUserFiles();
    checkForScriptFiles();
  }

  useEffect(() => {
    if (!evo || !userWorkspace) {
      return;
    }

    for (const file of uploadedFiles) {
      userWorkspace.writeFileSync(file.path, new TextDecoder().decode(file.content));
    }

    checkForUserFiles();
  }, [uploadedFiles]);

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

  useEffect(() => {
    try {
      if (!apiKey) {
        setConfigOpen(true);
        return;
      }
      setDojoError(undefined);
      const logger = new EvoCore.Logger([
        new EvoCore.ConsoleLogger()
      ], {
        promptUser: () => Promise.resolve("N/A"),
        logUserPrompt: () => {}
      });
      const scriptsWorkspace = new EvoCore.InMemoryWorkspace();
      const scripts = new EvoCore.Scripts(
        scriptsWorkspace
      );
      setScriptsWorkspace(scriptsWorkspace);
      const env = new EvoCore.Env(
        {
          "OPENAI_API_KEY": apiKey,
          "GPT_MODEL": "gpt-4-0613",
          "CONTEXT_WINDOW_TOKENS": "8000",
          "MAX_RESPONSE_TOKENS": "2000"
        }
      );
      const llm = new EvoCore.OpenAI(
        env.OPENAI_API_KEY,
        env.GPT_MODEL,
        env.CONTEXT_WINDOW_TOKENS,
        env.MAX_RESPONSE_TOKENS,
        logger
      );
      const userWorkspace = new EvoCore.InMemoryWorkspace();
      setUserWorkspace(userWorkspace);
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
    } catch (err) {
      setDojoError(err);
    }
  }, [apiKey])

  return (
    <div className="Dojo">
      {(!apiKey || configOpen) &&
        <DojoConfig
          apiKey={apiKey}
          onConfigSaved={onConfigSaved}
        />
      }
      <Sidebar onSettingsClick={() => setConfigOpen(true)} scripts={scripts} userFiles={userFiles} uploadUserFiles={setUploadedFiles} />
      <>
        {evo && <Chat evo={evo} onMessage={onMessage} />}
        {dojoError && <DojoError error={dojoError} />}
      </>
    </div>
  );
}

export default Dojo;
