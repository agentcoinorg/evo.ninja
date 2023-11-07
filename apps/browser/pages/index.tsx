import React, { useState, useEffect } from "react";

import { InMemoryFile } from "@nerfzael/memory-fs";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";
import clsx from "clsx";

import DojoConfig from "../src/components/DojoConfig";
import DojoError from "../src/components/DojoError";
import Sidebar from "../src/components/Sidebar";
import Chat, { ChatMessage } from "../src/components/Chat";
import { MarkdownLogger } from "../src/sys/logger";
import { updateWorkspaceFiles } from "../src/updateWorkspaceFiles";
import {
  AgentContext,
  Evo,
  SubWorkspace,
  InMemoryWorkspace,
  Logger,
  ConsoleLogger,
  Scripts,
  Env,
  OpenAI,
  LlmModel,
  Chat as EvoChat,
} from "@evo-ninja/agents";
import { createInBrowserScripts } from "../src/scripts";

function Dojo() {
  const [dojoConfig, setDojoConfig] = useState<{
    openAiApiKey: string | null;
    model: string | null;
    serpApiKey: string | null;
    loaded: boolean;
  }>({
    openAiApiKey: null,
    model: null,
    serpApiKey: null,
    loaded: false,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [dojoError, setDojoError] = useState<unknown | undefined>(undefined);
  const [evo, setEvo] = useState<Evo | undefined>(undefined);
  const [scripts, setScripts] = useState<InMemoryFile[]>([]);
  const [userFiles, setUserFiles] = useState<InMemoryFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<InMemoryFile[]>([]);
  const [userWorkspace, setUserWorkspace] = useState<
    InMemoryWorkspace | undefined
  >(undefined);
  const [scriptsWorkspace, setScriptsWorkspace] = useState<
    InMemoryWorkspace | undefined
  >(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // TODO: setGoalEnded is unused?
  const [goalEnded, setGoalEnded] = useState<boolean>(false);

  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
    setDojoConfig({
      openAiApiKey: localStorage.getItem("openai-api-key"),
      model: localStorage.getItem("openai-model"),
      serpApiKey: localStorage.getItem("serp-api-key"),
      loaded: true
    });
  }, []);

  useEffect(() => {
    if (!evo || !scriptsWorkspace) {
      return;
    }

    const items = scriptsWorkspace.readdirSync("");
    if (!items) {
      return;
    }

    setScripts(
      items.map(
        (x) =>
          new InMemoryFile(
            x.name,
            new TextEncoder().encode(scriptsWorkspace.readFileSync(x.name)) ||
              ""
          )
      )
    );
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
    setMessages((messages) => [...messages, message]);
    checkForUserFiles();
    checkForScriptFiles();
  }

  useEffect(() => {
    if (!evo || !userWorkspace) {
      return;
    }

    for (const file of uploadedFiles) {
      userWorkspace.writeFileSync(
        file.path,
        new TextDecoder().decode(file.content)
      );
    }

    checkForUserFiles();
  }, [uploadedFiles]);

  const onConfigSaved = (apiKey: string, model: string, serpApiKey: string) => {
    let configComplete = true;

    if (!apiKey) {
      localStorage.removeItem("openai-api-key");
      setDojoConfig({ ...dojoConfig, openAiApiKey: null});
      configComplete = false;
    } else {
      localStorage.setItem("openai-api-key", apiKey);
      setDojoConfig({ ...dojoConfig, openAiApiKey: apiKey});
    }

    if (!model) {
      localStorage.removeItem("openai-model");
      setDojoConfig({ ...dojoConfig, model: null});
      configComplete = false;
    } else {
      localStorage.setItem("openai-model", model);
      setDojoConfig({ ...dojoConfig, model });
    }

    if (!serpApiKey) {
      localStorage.removeItem("serp-api-key");
      setDojoConfig({ ...dojoConfig, serpApiKey: null});
      configComplete = false;
    } else {
      localStorage.setItem("serp-api-key", serpApiKey);
      setDojoConfig({ ...dojoConfig, serpApiKey });
    }

    // Only close the modal if all configuration is complete
    setConfigOpen(!configComplete);
  };

  useEffect(() => {
    try {
      if (dojoConfig.loaded && (!dojoConfig.openAiApiKey || !dojoConfig.model)) {
        setConfigOpen(true);
        return;
      }
      setDojoError(undefined);

      const markdownLogger = new MarkdownLogger({
        onLog: (markdown: string, color?: string) => {
          onMessage({
            user: "evo",
            title: markdown,
            color,
          });
        },
      });
      const logger = new Logger([markdownLogger, new ConsoleLogger()], {
        promptUser: () => Promise.resolve("N/A")
      });

      const scriptsWorkspace = createInBrowserScripts();

      const scripts = new Scripts(scriptsWorkspace);

      setScriptsWorkspace(scriptsWorkspace);

      const env = new Env({
        OPENAI_API_KEY: dojoConfig.openAiApiKey as string,
        GPT_MODEL: dojoConfig.model as string,
        CONTEXT_WINDOW_TOKENS: "8000",
        MAX_RESPONSE_TOKENS: "2000",
        SERP_API_KEY: dojoConfig.serpApiKey || undefined,
      });

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

      const chat = new EvoChat(cl100k_base);

      setEvo(
        new Evo(
          new AgentContext(
            llm,
            chat,
            logger,
            userWorkspace,
            internals,
            env,
            scripts
          )
        )
      );
    } catch (err) {
      setDojoError(err);
    }
  }, [dojoConfig]);

  return (
    <div className="flex h-full bg-neutral-800 bg-landing-bg bg-repeat text-center text-neutral-400">
      {(dojoConfig.loaded && !dojoConfig.openAiApiKey || configOpen) && (
        <DojoConfig
          apiKey={dojoConfig.openAiApiKey}
          model={dojoConfig.model}
          serpApiKey={dojoConfig.serpApiKey}
          onConfigSaved={onConfigSaved}
        />
      )}
      <div className={clsx(
        "relative w-full lg:w-auto lg:max-w-md",
        {
          hidden: !sidebarOpen,
        },
      )}>
        <Sidebar
          onSidebarToggleClick={() => {
            setSidebarOpen(!sidebarOpen);
          }}
          onSettingsClick={() => setConfigOpen(true)}
          userFiles={userFiles}
          uploadUserFiles={setUploadedFiles}
        />
      </div>
      <div className={clsx("relative grow border-l-2 border-neutral-700", {
        "max-lg:hidden": sidebarOpen,
      })}>
        <>
          {evo && (
            <Chat
              evo={evo}
              onMessage={onMessage}
              messages={messages}
              goalEnded={goalEnded}
              onSidebarToggleClick={() => {
                setSidebarOpen(!sidebarOpen);
              }}
            />
          )}
          {dojoError && <DojoError error={dojoError} />}
        </>
      </div>
    </div>
  );
}

export default Dojo;
