"use client"

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";

import { InMemoryFile } from "@nerfzael/memory-fs";
import clsx from "clsx";
import AccountConfig from "@/components/AccountConfig";
import Sidebar from "@/components/Sidebar";
import Chat, { ChatMessage } from "@/components/Chat";
import { updateWorkspaceFiles } from "@/lib/updateWorkspaceFiles";
import WelcomeModal from "@/components/WelcomeModal";
import { useSession } from "next-auth/react";
import { AuthProxy } from "@/lib/api/AuthProxy";
import { useEvo, userWorkspaceAtom } from "@/lib/hooks/useEvo";
import { allowTelemetryAtom, capReachedAtom, localOpenAiApiKeyAtom, welcomeModalAtom } from "@/lib/store";
import { toast } from "react-toastify"

function Dojo() {
  const [allowTelemetry] = useAtom(allowTelemetryAtom)
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom)
  const { data: session } = useSession();
  const [error, setError] = useState<string | undefined>()
  const [welcomeModalSeen, setWelcomeModalSeen] = useAtom(welcomeModalAtom);
  const firstTimeUser = !localOpenAiApiKey && !session?.user;

  useEffect(() => {
    if (error) {
      toast.error(error, {
        theme: "dark",
        autoClose: 5000
      })
      setTimeout(() => setError(undefined), 5000)
    }
  }, [error])

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const onMessage = (message: ChatMessage) => {
    setMessages((messages) => [...messages, message]);
    checkForUserFiles();
  };
  const { evo, proxyEmbeddingApi, proxyLlmApi } = useEvo(onMessage, setError);
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

    const subsidize = !localOpenAiApiKey;

    setAwaitingAuth(true);
    const goalId = await AuthProxy.checkGoal(
      allowTelemetry ? message : "<redacted>",
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
            apiKey={localOpenAiApiKey}
            allowTelemetry={allowTelemetry}
            onClose={() => {
              setAccountModalOpen(false);
            }}
            firstTimeUser={firstTimeUser}
            setError={setError}
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
          {evo && (
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
