"use client";

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";

import { InMemoryFile } from "@nerfzael/memory-fs";
import clsx from "clsx";
// import AccountConfig from "@/components/AccountConfig";
import Sidebar from "@/components/Sidebar";
import CloseSidebarIcon from "@/components/CloseSidebarIcon";
import Chat, { ChatMessage } from "@/components/Chat";
import { updateWorkspaceFiles } from "@/lib/updateWorkspaceFiles";
import WelcomeModal from "@/components/WelcomeModal";
import { useSession } from "next-auth/react";
import { AuthProxy } from "@/lib/api/AuthProxy";
import { useEvo, userWorkspaceAtom } from "@/lib/hooks/useEvo";
import {
  allowTelemetryAtom,
  capReachedAtom,
  localOpenAiApiKeyAtom,
  welcomeModalAtom,
} from "@/lib/store";
import { toast } from "react-toastify";

function Dojo() {
  const [allowTelemetry] = useAtom(allowTelemetryAtom);
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const { data: session } = useSession();
  const [error, setError] = useState<string | undefined>();
  const [welcomeModalSeen, setWelcomeModalSeen] = useAtom(welcomeModalAtom);
  const firstTimeUser = !localOpenAiApiKey && !session?.user;

  useEffect(() => {
    if (error) {
      toast.error(error, {
        theme: "dark",
        autoClose: 5000,
      });
      setTimeout(() => setError(undefined), 5000);
    }
  }, [error]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const onMessage = (message: ChatMessage) => {
    setMessages((messages) => [...messages, message]);
    checkForUserFiles();
  };
  const { evo, proxyEmbeddingApi, proxyLlmApi } = useEvo(onMessage, setError);
  const [userWorkspace] = useAtom(userWorkspaceAtom);
  const [, setCapReached] = useAtom(capReachedAtom);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveringSidebarButton, setHovering] = useState<boolean>(false);
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
      <div className="relative flex h-full overflow-x-clip">
        <div className="pointer-events-none fixed inset-0 bottom-0 left-0 right-0 top-0 overflow-clip">
          <div className="mix-blend-softlight absolute -bottom-1/4 left-1/3 h-screen w-7/12 rotate-[-30deg] rounded-full bg-gradient-to-b from-cyan-500/40 to-cyan-700/10 opacity-30 blur-[128px]" />
          <div className="mix-blend-softlight absolute -bottom-1/4 left-[65%] h-[50vh] w-4/12 rotate-[30deg] rounded-full bg-gradient-to-b from-pink-500/40 to-pink-600/20 opacity-10 blur-[128px]" />
        </div>
        <div className="relative w-full transition-transform lg:w-auto lg:max-w-md">
          <Sidebar
            hoveringSidebarButton={hoveringSidebarButton}
            sidebarOpen={sidebarOpen}
            // onSettingsClick={() => setAccountModalOpen(true)}
            userFiles={userFiles}
            onUploadFiles={setUploadedFiles}
          />
          <button
            className="absolute -right-8 top-1/2 z-10 cursor-pointer"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <CloseSidebarIcon
              hoveringSidebarButton={hoveringSidebarButton}
              sidebarOpen={sidebarOpen}
            />
          </button>
        </div>
        <div
          className={clsx("relative grow", {
            "max-lg:hidden": sidebarOpen,
          })}
        >
          {evo && (
            <Chat
              landingPage={firstTimeUser}
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
        </div>
      </div>
      <WelcomeModal
        apiKey={localOpenAiApiKey}
        allowTelemetry={allowTelemetry}
        firstTimeUser={firstTimeUser}
        isOpen={!welcomeModalSeen}
        onClose={() => setWelcomeModalSeen(true)}
      />
    </>
  );
}

export default Dojo;
