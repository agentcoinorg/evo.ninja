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
import WelcomeModal from "../src/components/WelcomeModal";
import { BrowserLogger } from "../src/sys/logger";
import { ProxyLlmApi, ProxyEmbeddingApi } from "../src/api";
import { useSession } from "next-auth/react";
import { AuthProxy } from "../src/api/AuthProxy";
import { useDojo, welcomeModalAtom } from "../src/hooks/useDojo";
import { useAtom } from "jotai";

function Dojo() {
  const { dojo, setDojoError } = useDojo()
  const { data: session } = useSession()
  const [welcomeModalSeen, setWelcomeModalSeen] = useAtom(welcomeModalAtom)
  const firstTimeUser = !dojo.config.openAiApiKey && !session?.user;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountModal, setAccountModalOpen] = useState(false);
  const [evo, setEvo] = useState<Evo | undefined>(undefined);
  const [proxyEmbeddingApi, setProxyEmbeddingApi] = useState<ProxyEmbeddingApi | undefined>(undefined);
  const [proxyLlmApi, setProxyLlmApi] = useState<ProxyLlmApi | undefined>(undefined);
  const [userFiles, setUserFiles] = useState<InMemoryFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<InMemoryFile[]>([]);
  const [userWorkspace, setUserWorkspace] = useState<
    InMemoryWorkspace | undefined
  >(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [capReached, setCapReached] = useState<boolean>(false)
  const [awaitingAuth, setAwaitingAuth] = useState<boolean>(false);

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

  useEffect(() => {
    (async () => {
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

        const env = new Env({
          OPENAI_API_KEY: dojo.config.openAiApiKey || " ",
          GPT_MODEL: "gpt-4",
          CONTEXT_WINDOW_TOKENS: "8000",
          MAX_RESPONSE_TOKENS: "2000",
        });

        let llm: LlmApi;
        let embedding: EmbeddingApi;

        if (dojo.config.openAiApiKey) {
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
        setDojoError(err as string);
      }
    })();
  }, [dojo.config]);

  const handlePromptAuth = async (message: string) => {
    if (awaitingAuth) {
      return false;
    }

    if (!dojo.config.openAiApiKey && !session?.user) {
      // setFirstTimeUser(true);
      setAccountModalOpen(true);
      return false;
    } else {
      // setFirstTimeUser(false);
    }

    const subsidize = !dojo.config.openAiApiKey;

    setAwaitingAuth(true);
    const goalId = await AuthProxy.checkGoal(
      dojo.config.allowTelemetry ? message : "<redacted>",
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
        {(accountModal || capReached) && (
          <AccountConfig
            apiKey={dojo.config.openAiApiKey}
            allowTelemetry={dojo.config.allowTelemetry}
            onClose={() => { 
              setAccountModalOpen(false)
            }}
            capReached={capReached}
            firstTimeUser={firstTimeUser}
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
            onSettingsClick={() => setAccountModalOpen(true)}
            userFiles={userFiles}
            onUploadFiles={setUploadedFiles}
          />
        </div>
        <div className={clsx("relative grow border-l-2 border-neutral-700", {
          "max-lg:hidden": sidebarOpen,
        })}>
          <>
            {dojo.error ? <DojoError error={dojo.error} /> : evo && (
              <Chat
                evo={evo}
                onMessage={onMessage}
                messages={messages}
                sidebarOpen={sidebarOpen}
                overlayOpen={!welcomeModalSeen || accountModal}
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
      <WelcomeModal isOpen={!welcomeModalSeen} onClose={() => setWelcomeModalSeen(true)} />
    </>
  );
}

export default Dojo;
