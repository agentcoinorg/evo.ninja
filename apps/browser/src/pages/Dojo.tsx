import { useState, useEffect } from 'react';

import { InMemoryFile } from '@nerfzael/memory-fs';
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";
import clsx from 'clsx';

import './Dojo.css';

import DojoConfig from "../components/DojoConfig/DojoConfig";
import DojoError from "../components/DojoError/DojoError";
import Sidebar from "../components/Sidebar/Sidebar";
import Chat, { ChatMessage } from "../components/Chat/Chat";
import { MarkdownLogger } from '../sys/logger';
import { updateWorkspaceFiles } from '../updateWorkspaceFiles';
// import { onGoalAchievedScript, onGoalFailedScript, speakScript } from '../scripts';
import {
  AgentContext,
  Evo,
  SubWorkspace,
  Workspace,
  InMemoryWorkspace,
  Logger,
  ConsoleLogger,
  Scripts,
  Env,
  OpenAI,
  LlmModel,
  Chat as EvoChat
} from '@evo-ninja/agents';
import { createInBrowserScripts } from '../scripts';


function Dojo() {
  const [apiKey, setApiKey] = useState<string | null>(
    localStorage.getItem("openai-api-key")
  );
  const [model, setModel] = useState<string | null>(
    localStorage.getItem("openai-model")
  );
  const [serpApiKey, setSerpApiKey] = useState<string | null>(
    localStorage.getItem("serp-api-key")
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [dojoError, setDojoError] = useState<unknown | undefined>(undefined);
  const [evo, setEvo] = useState<Evo | undefined>(undefined);
  const [scripts, setScripts] = useState<InMemoryFile[]>([]);
  const [userFiles, setUserFiles] = useState<InMemoryFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<InMemoryFile[]>([]);
  const [userWorkspace, setUserWorkspace] = useState<InMemoryWorkspace | undefined>(undefined);
  const [scriptsWorkspace, setScriptsWorkspace] = useState<InMemoryWorkspace | undefined>(undefined);
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

    setScripts(items.map(x => new InMemoryFile(x.name, new TextEncoder().encode(scriptsWorkspace.readFileSync(x.name)) || "")));
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

  const onConfigSaved = (apiKey: string, model: string, serpApiKey: string) => {
    let configComplete = true;

    if (!apiKey) {
      localStorage.removeItem("openai-api-key");
      setApiKey(null);
      configComplete = false;
    } else {
      localStorage.setItem("openai-api-key", apiKey);
      setApiKey(apiKey);
    }

    if (!model) {
      localStorage.removeItem("openai-model");
      setModel(null);
      configComplete = false;
    } else {
      localStorage.setItem("openai-model", model);
      setModel(model);
    }

    if (!serpApiKey) {
      localStorage.removeItem("serp-api-key");
      setSerpApiKey(null);
      configComplete = false;
    } else {
      localStorage.setItem("serp-api-key", serpApiKey);
      setSerpApiKey(serpApiKey);
    }

    // Only close the modal if all configuration is complete
    setConfigOpen(!configComplete);
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
      const logger = new Logger([
        markdownLogger,
        new ConsoleLogger()
      ], {
        promptUser: () => Promise.resolve("N/A"),
        logUserPrompt: () => {}
      });

      const scriptsWorkspace = createInBrowserScripts();
      // const scriptsWorkspace = new InMemoryWorkspace();
      // addScript(onGoalAchievedScript, scriptsWorkspace);
      // addScript(onGoalFailedScript, scriptsWorkspace);
      // addScript(speakScript, scriptsWorkspace);

      const scripts = new Scripts(
        scriptsWorkspace
      );

      setScriptsWorkspace(scriptsWorkspace);

      const env = new Env(
        {
          "OPENAI_API_KEY": apiKey,
          "GPT_MODEL": model,
          "CONTEXT_WINDOW_TOKENS": "8000",
          "MAX_RESPONSE_TOKENS": "2000",
          "SERP_API_KEY": serpApiKey || undefined,
        }
      );

      const llm = new OpenAI(
        env.OPENAI_API_KEY,
        env.GPT_MODEL as LlmModel,
        env.CONTEXT_WINDOW_TOKENS,
        env.MAX_RESPONSE_TOKENS,
        logger
      );

      const userWorkspace = new InMemoryWorkspace();
      setUserWorkspace(userWorkspace);

      const internals = new SubWorkspace(".evo", userWorkspace);

      const chat = new EvoChat(
        cl100k_base,
      );

      setEvo(new Evo(
        new AgentContext(
          llm,
          chat,
          logger,
          userWorkspace,
          internals,
          env,
          scripts,
        )
      ));
    } catch (err) {
      setDojoError(err);
    }
  }, [apiKey, model, serpApiKey])

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
          serpApiKey={serpApiKey}
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
