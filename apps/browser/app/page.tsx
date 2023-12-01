"use client"

import React, { useState, useEffect } from "react";

import { InMemoryFile } from "@nerfzael/memory-fs";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";
import clsx from "clsx";
import AccountConfig from "../src/components/AccountConfig";
import DojoError from "../src/components/DojoError";
import Sidebar from "../src/components/Sidebar";
import Chat, { ChatMessage } from "../src/components/Chat";
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
  OpenAILlmApi,
  LlmModel,
  LlmApi,
  EmbeddingApi,
  Chat as EvoChat,
  OpenAIEmbeddingAPI,
} from "@evo-ninja/agents";
import { createInBrowserScripts } from "../src/scripts";
import WelcomeModal, { WELCOME_MODAL_SEEN_STORAGE_KEY } from "../src/components/WelcomeModal";
import { BrowserLogger } from "../src/sys/logger";
import { checkLlmModel } from "../src/checkLlmModel";
import { ProxyLlmApi, ProxyEmbeddingApi } from "../src/api";
import { AuthProxy } from "../src/AuthProxy";
import { useSession } from "../src/supabase/useSession";

function Dojo() {
  const [dojoConfig, setDojoConfig] = useState<{
    openAiApiKey: string | null;
    allowTelemetry: boolean;
    loaded: boolean;
    complete: boolean;
  }>({
    openAiApiKey: null,
    allowTelemetry: false,
    loaded: false,
    complete: false
  });
  const [welcomeModalOpen, setWelcomeModalOpen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountModal, setAccountModalOpen] = useState(false);
  const [dojoError, setDojoError] = useState<unknown | undefined>(undefined);
  const [evo, setEvo] = useState<Evo | undefined>(undefined);
  const [proxyEmbeddingApi, setProxyEmbeddingApi] = useState<ProxyEmbeddingApi | undefined>(undefined);
  const [proxyLlmApi, setProxyLlmApi] = useState<ProxyLlmApi | undefined>(undefined);
  const [userFiles, setUserFiles] = useState<InMemoryFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<InMemoryFile[]>([]);
  const [userWorkspace, setUserWorkspace] = useState<
    InMemoryWorkspace | undefined
  >(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // TODO: setGoalEnded is unused?
  const [goalEnded, setGoalEnded] = useState<boolean>(false);
  const [capReached, setCapReached] = useState<boolean>(false)
  const { session } = useSession()
  const [awaitingAuth, setAwaitingAuth] = useState<boolean>(false);
  const [firstTimeUser, setFirstTimeUser] = useState<boolean>(false);

  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
    const openAiApiKey = localStorage.getItem("openai-api-key");
    const allowTelemetry = localStorage.getItem("allow-telemetry") === "true" ? true : false;
    const complete = !!openAiApiKey;
    setDojoConfig({
      openAiApiKey,
      allowTelemetry,
      loaded: true,
      complete
    });
  }, []);

  useEffect(() => {
    const firstVisit = localStorage.getItem(WELCOME_MODAL_SEEN_STORAGE_KEY);
    if (!firstVisit) {
      localStorage.setItem(WELCOME_MODAL_SEEN_STORAGE_KEY, "true");
      setWelcomeModalOpen(true);
    }
  }, [])

  function checkForUserFiles() {
    if (!evo || !userWorkspace) {
      return;
    }
    updateWorkspaceFiles(userWorkspace, userFiles, setUserFiles);
  }

  function onMessage(message: ChatMessage) {
    setMessages((messages) => [...messages, message]);
    checkForUserFiles();
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

  const onConfigSaved = (apiKey: string, allowTelemetry: boolean) => {
    let complete = true;
    let openAiApiKey = apiKey;

    if (!openAiApiKey) {
      complete = false;
      localStorage.removeItem("openai-api-key");
    } else {
      localStorage.setItem("openai-api-key", openAiApiKey);
    }
    localStorage.setItem("allow-telemetry", allowTelemetry.toString());

    setDojoConfig({
      openAiApiKey,
      allowTelemetry,
      loaded: true,
      complete
    });
    setCapReached(false);
    setAccountModalOpen(false);
  };

  const onDisclaimerSelect = (approve: boolean) => {
    localStorage.setItem("allow-telemetry", approve.toString());
    setDojoConfig({
      ...dojoConfig,
      allowTelemetry: approve
    });
  };

  useEffect(() => {
    (async () => {
      setDojoError(undefined);
      try {
        const browserLogger = new BrowserLogger({
          onLog: (message: string) => {
            onMessage({
              user: "evo",
              title: message,
            });
          },
        });
        const logger = new Logger([browserLogger, new ConsoleLogger()], {
          promptUser: () => Promise.resolve("N/A"),
        });

        const scriptsWorkspace = createInBrowserScripts();
        const scripts = new Scripts(scriptsWorkspace);

        // Point by default to GPT-4 unless the given api key's account doesn't support it
        let model = "gpt-4"
        if (dojoConfig.openAiApiKey) {
          try {
            model = await checkLlmModel(dojoConfig.openAiApiKey as string, model);
          } catch (e: any) {
            if (e.message.includes("Incorrect API key provided")) {
              setDojoError("Open AI API key is not correct. Please make sure it has the correct format")
              return
            }
          }
        }

        const env = new Env({
          OPENAI_API_KEY: dojoConfig.openAiApiKey || " ",
          GPT_MODEL: model,
          CONTEXT_WINDOW_TOKENS: "8000",
          MAX_RESPONSE_TOKENS: "2000",
        });

        let llm: LlmApi;
        let embedding: EmbeddingApi;

        if (dojoConfig.openAiApiKey) {
          llm = new OpenAILlmApi(
            env.OPENAI_API_KEY,
            env.GPT_MODEL as LlmModel,
            env.CONTEXT_WINDOW_TOKENS,
            env.MAX_RESPONSE_TOKENS,
            logger
          );
          embedding = new OpenAIEmbeddingAPI(env.OPENAI_API_KEY, logger, cl100k_base)
        } else {
          llm = new ProxyLlmApi(
            env.GPT_MODEL as LlmModel,
            env.CONTEXT_WINDOW_TOKENS,
            env.MAX_RESPONSE_TOKENS,
            () => setCapReached(true)
          );
          setProxyLlmApi(llm as ProxyLlmApi);
          embedding = new ProxyEmbeddingApi(cl100k_base, () => setCapReached(true));
          setProxyEmbeddingApi(embedding as ProxyEmbeddingApi);
        }

        let workspace = userWorkspace;

        if (!workspace) {
          workspace = new InMemoryWorkspace();
          setUserWorkspace(workspace);
        }

        const internals = new SubWorkspace(".evo", workspace);

        const chat = new EvoChat(cl100k_base);
        setEvo(
          new Evo(
            new AgentContext(
              llm,
              embedding,
              chat,
              logger,
              workspace,
              internals,
              env,
              scripts
            )
          )
        );
      } catch (err) {
        setDojoError(err);
      }
    })();
  }, [dojoConfig]);

  const handlePromptAuth = async (message: string) => {
    if (awaitingAuth) {
      return false;
    }

    if (!dojoConfig.openAiApiKey && !session?.user) {
      setFirstTimeUser(true);
      setAccountModalOpen(true);
      return false;
    } else {
      setFirstTimeUser(false);
    }

    const subsidize = !dojoConfig.openAiApiKey;

    setAwaitingAuth(true);
    const goalId = await AuthProxy.checkGoal(
      dojoConfig.allowTelemetry ? message : "<redacted>",
      subsidize,
      () => setCapReached(true)
    );
    setAwaitingAuth(false);

    if (!goalId) {
      return false;
    }

    proxyLlmApi?.setGoalId(goalId);
    proxyEmbeddingApi?.setGoalId(goalId);
    return true
  }

  return (
    <>
      <div className="flex h-full bg-neutral-800 bg-landing-bg bg-repeat text-center text-neutral-400">
        <AccountConfig
          isOpen={accountModal || capReached}
          onClose={() => setAccountModalOpen(false)}
          apiKey={dojoConfig.openAiApiKey}
          allowTelemetry={dojoConfig.allowTelemetry}
          onConfigSaved={onConfigSaved}
          capReached={capReached}
          firstTimeUser={firstTimeUser}
        />
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
            onSettingsClick={() => setAccountModalOpen(true)}
            userFiles={userFiles}
            onUploadFiles={setUploadedFiles}
          />
        </div>
        <div className={clsx("relative grow border-l-2 border-neutral-700", {
          "max-lg:hidden": sidebarOpen,
        })}>
          <>
            {dojoError ? <DojoError error={dojoError} /> : evo && (
              <Chat
                evo={evo}
                onMessage={onMessage}
                messages={messages}
                goalEnded={goalEnded}
                sidebarOpen={sidebarOpen}
                overlayOpen={welcomeModalOpen || accountModal}
                onDisclaimerSelect={onDisclaimerSelect}
                onSidebarToggleClick={() => {
                  setSidebarOpen(!sidebarOpen);
                }}
                onUploadFiles={setUploadedFiles}
                handlePromptAuth={handlePromptAuth}
              />
            )}
          </>
        </div>
      </div>
      <WelcomeModal isOpen={welcomeModalOpen} onClose={() => setWelcomeModalOpen(false)} />
    </>
  );
}

export default Dojo;
