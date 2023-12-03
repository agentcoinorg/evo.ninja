"use client"

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";

import { InMemoryFile } from "@nerfzael/memory-fs";
import clsx from "clsx";
import AccountConfig from "@/components/AccountConfig";
import DojoError from "@/components/DojoError";
import Sidebar from "@/components/Sidebar";
import Chat, { ChatMessage } from "@/components/Chat";
import { updateWorkspaceFiles } from "@/lib/updateWorkspaceFiles";
import WelcomeModal from "@/components/WelcomeModal";
import { useSession } from "next-auth/react";
import { AuthProxy } from "@/lib/api/AuthProxy";
import { useDojo } from "@/lib/hooks/useDojo";
import { useEvo, userWorkspaceAtom } from "@/lib/hooks/useEvo";
import { capReachedAtom, welcomeModalAtom } from "@/lib/store";

function Dojo() {
  const { dojo } = useDojo();
  const { data: session } = useSession();
  const [welcomeModalSeen, setWelcomeModalSeen] = useAtom(welcomeModalAtom);
  const firstTimeUser = !dojo.config.openAiApiKey && !session?.user;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const onMessage = (message: ChatMessage) => {
    setMessages((messages) => [...messages, message]);
    checkForUserFiles();
  };
  const { evo, proxyEmbeddingApi, proxyLlmApi } = useEvo(onMessage);
  const [userWorkspace] = useAtom(userWorkspaceAtom);
  const [, setCapReached] = useAtom(capReachedAtom);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountModal, setAccountModalOpen] = useState(false);
  const [userFiles, setUserFiles] = useState<InMemoryFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<InMemoryFile[]>([]);
  const [awaitingAuth, setAwaitingAuth] = useState<boolean>(false);

  function checkForUserFiles() {
    if (!evo || !userWorkspace) {
      return;
    }
    updateWorkspaceFiles(userWorkspace, userFiles, setUserFiles);
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

  const handlePromptAuth = async (message: string) => {
    if (awaitingAuth) {
      return false;
    }

    if (firstTimeUser) {
      setAccountModalOpen(true);
      return false;
    }

    const subsidize = !dojo.config.openAiApiKey;

    setAwaitingAuth(true);
    const goalId = await AuthProxy.checkGoal(
      dojo.config.allowTelemetry ? message : "<redacted>",
      subsidize,
      () => {
        setCapReached(true);
        setAccountModalOpen(true);
      }
    );
    setAwaitingAuth(false);

    if (!goalId) {
      return false;
    }

    proxyLlmApi?.setGoalId(goalId);
    proxyEmbeddingApi?.setGoalId(goalId);
    return true;
  };

  return (
    <>
      <div className="flex h-full bg-neutral-800 bg-landing-bg bg-repeat text-center text-neutral-400">
        {accountModal && (
          <AccountConfig
            apiKey={dojo.config.openAiApiKey}
            allowTelemetry={dojo.config.allowTelemetry}
            onClose={() => {
              setAccountModalOpen(false);
            }}
            firstTimeUser={firstTimeUser}
          />
        )}
        <div
          className={clsx("relative w-full lg:w-auto lg:max-w-md", {
            hidden: !sidebarOpen,
          })}
        >
          <Sidebar
            onSidebarToggleClick={() => {
              setSidebarOpen(!sidebarOpen);
            }}
            onSettingsClick={() => setAccountModalOpen(true)}
            userFiles={userFiles}
            onUploadFiles={setUploadedFiles}
          />
        </div>
        <div
          className={clsx("relative grow border-l-2 border-neutral-700", {
            "max-lg:hidden": sidebarOpen,
          })}
        >
          <>
            {dojo.error ? <DojoError
                error={dojo.error}
                sidebarOpen={sidebarOpen}
                onSidebarToggleClick={() => {
                  setSidebarOpen(!sidebarOpen)
                }}
              /> : evo && (
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
      <WelcomeModal
        isOpen={!welcomeModalSeen}
        onClose={() => setWelcomeModalSeen(true)}
      />
    </>
  );
}

export default Dojo;
