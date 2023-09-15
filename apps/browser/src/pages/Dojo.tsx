import { useState, useEffect } from 'react';

import * as EvoCore from "@evo-ninja/core";
import { Workspace } from '@evo-ninja/core';
import { InMemoryFile } from '@nerfzael/memory-fs';
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";
import { PluginPackage } from "@polywrap/plugin-js";

import './Dojo.css';

import DojoConfig from "../components/DojoConfig/DojoConfig";
import DojoError from "../components/DojoError/DojoError";
import Sidebar from "../components/Sidebar/Sidebar";
import Chat, { ChatMessage } from "../components/Chat/Chat";
import { MarkdownLogger } from '../sys/logger';
import { updateWorkspaceFiles } from '../updateWorkspaceFiles';
import { onGoalAchievedScript, onGoalFailedScript, speakScript } from '../scripts';

import clsx from 'clsx';
import MenuIcon from "../components/MenuIcon";

function addScript(script: {name: string, definition: string, code: string}, scriptsWorkspace: Workspace) {
  scriptsWorkspace.writeFileSync(`${script.name}.json`, script.definition);
  scriptsWorkspace.writeFileSync(`${script.name}.js`, script.code);
}

function Dojo() {
  const [apiKey, setApiKey] = useState<string | null>(
    localStorage.getItem("openai-api-key")
  );
  const [model, setModel] = useState<string | null>(
    localStorage.getItem("openai-model")
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [dojoError, setDojoError] = useState<unknown | undefined>(undefined);
  const [evo, setEvo] = useState<EvoCore.Evo | undefined>(undefined);
  const [scripts, setScripts] = useState<InMemoryFile[]>([]);
  const [userFiles, setUserFiles] = useState<InMemoryFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<InMemoryFile[]>([]);
  const [userWorkspace, setUserWorkspace] = useState<EvoCore.InMemoryWorkspace | undefined>(undefined);
  const [scriptsWorkspace, setScriptsWorkspace] = useState<EvoCore.InMemoryWorkspace | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [goalEnded, setGoalEnded] = useState<boolean>(false);

  useEffect(() => {
    if(window.innerWidth <= 1024){
      setSidebarOpen(false);
    }
  }, []);

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

  function onMessage(message: ChatMessage) {
    setMessages((messages) => [
      ...messages,
      message
    ]);
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

  const onConfigSaved = (apiKey: string, model: string) => {
    if (!apiKey) {
      localStorage.removeItem("openai-api-key");
      setApiKey(null);
      setConfigOpen(true);
    } else {
      localStorage.setItem("openai-api-key", apiKey);
      setConfigOpen(false);
      setApiKey(apiKey);
    }

    if(!model) {
      localStorage.removeItem("opeanai-model");
      setModel(null);
      setConfigOpen(true);
    } else {
      localStorage.setItem("openai-model", model);
      setModel(model);
      setConfigOpen(false);
    }
  }

  useEffect(() => {
    try {
      if (!apiKey || !model) {
        setConfigOpen(true);
        return;
      }
      setDojoError(undefined);

      const markdownLogger = new MarkdownLogger({
        onLog: (markdown: string, color?: string) => {
          onMessage({
            user: "evo",
            title: markdown,
            color
          });
        }
      });
      const logger = new EvoCore.Logger([
        markdownLogger,
        new EvoCore.ConsoleLogger()
      ], {
        promptUser: () => Promise.resolve("N/A"),
        logUserPrompt: () => {}
      });

      const scriptsWorkspace = new EvoCore.InMemoryWorkspace();
      addScript(onGoalAchievedScript, scriptsWorkspace);
      addScript(onGoalFailedScript, scriptsWorkspace);
      addScript(speakScript, scriptsWorkspace);

      const scripts = new EvoCore.Scripts(
        scriptsWorkspace
      );
      
      setScriptsWorkspace(scriptsWorkspace);

      const env = new EvoCore.Env(
        {
          "OPENAI_API_KEY": apiKey,
          "GPT_MODEL": model,
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
      const agentPackage = PluginPackage.from(module => ({
        "onGoalAchieved": async (args: any) => {
          logger.success("Goal has been achieved!");
          setGoalEnded(true);
        },
        "onGoalFailed": async (args: any) => {
          logger.error("Goal could not be achieved!");
          setGoalEnded(true);
        },
        "speak": async (args: any) => {
          logger.success("Evo: " + args.message);
          return "User has been informed! If you think you've achieved the goal, execute onGoalAchieved.\nIf you think you've failed, execute onGoalFailed.";
        },
        "ask": async (args: any) => {
          throw new Error("Not implemented");
        },
      }));

      setEvo(new EvoCore.Evo(
        userWorkspace,
        scripts,
        llm,
        chat,
        logger,
        agentPackage
      ));
    } catch (err) {
      setDojoError(err);
    }
  }, [apiKey, model])

  const sidebarContainerClassNames = clsx(["w-full lg:w-auto lg:max-w-md relative", {
    "hidden": !sidebarOpen
  }]);

  const chatContainerClassNames = clsx(["grow relative", {
    "max-lg:hidden": sidebarOpen
  }]);

  return (
    <div className="Dojo">
      {(!apiKey || configOpen) &&
        <DojoConfig
          apiKey={apiKey}
          model={model}
          onConfigSaved={onConfigSaved}
        />
      }
      <div className={sidebarContainerClassNames}>
        <Sidebar onSidebarToggleClick={() => {setSidebarOpen(!sidebarOpen)}} onSettingsClick={() => setConfigOpen(true)} scripts={scripts} userFiles={userFiles} uploadUserFiles={setUploadedFiles} />
      </div>
      <div className={chatContainerClassNames}>
        <>
          {evo && <Chat evo={evo} onMessage={onMessage} messages={messages} goalEnded={goalEnded} onSidebarToggleClick={() => {setSidebarOpen(!sidebarOpen)}}/>}
          {dojoError && <DojoError error={dojoError} />}
        </>
      </div>
    </div>
  );
}

export default Dojo;
