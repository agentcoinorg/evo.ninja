"use client";

import Chat, { ChatMessage } from "@/components/Chat";
import CloseSidebarIcon from "@/components/CloseSidebarIcon";
import Sidebar from "@/components/Sidebar";
import WelcomeModal from "@/components/modals/WelcomeModal";
import { ExamplePrompt, examplePrompts } from "@/lib/examplePrompts";
import { useCheckForUserFiles } from "@/lib/hooks/useCheckForUserFiles";
import { useEvo } from "@/lib/hooks/useEvo";
import { useHandleAuth } from "@/lib/hooks/useHandleAuth";
import { sidebarAtom, uploadedFilesAtom, userFilesAtom, welcomeModalAtom } from "@/lib/store";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useState } from "react";

function Dojo() {
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarAtom);
  const [userFiles] = useAtom(userFilesAtom)
  const [welcomeModalSeen, setWelcomeModalSeen] = useAtom(welcomeModalAtom);
  const [, setUploadedFiles] = useAtom(uploadedFilesAtom)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [samplePrompts, setSamplePrompts] = useState<
    ExamplePrompt[] | undefined
  >(examplePrompts);

  const checkForUserFiles = useCheckForUserFiles();
  const onMessage = (message: ChatMessage) => {
    setMessages((messages) => [...messages, message]);
    checkForUserFiles();
  };
  const {
    isRunning,
    isPaused,
    isSending,
    isStopped,
    start,
    onContinue,
    onPause,
    setIsSending,
  } = useEvo({ chatId: "", onMessage });
  const { handlePromptAuth } = useHandleAuth();
  const [hoveringSidebarButton, setHovering] = useState<boolean>(false);

  const handleSend = async (newMessage: string) => {
    if (!newMessage) return;
    const authorized = await handlePromptAuth(newMessage);

    if (!authorized) {
      return;
    }
    setSamplePrompts(undefined);
    onMessage({
      title: newMessage,
      user: "user",
    });
    setIsSending(true);
    start(newMessage);
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
          <Chat
            messages={messages}
            samplePrompts={samplePrompts}
            isPaused={isPaused}
            isRunning={isRunning}
            isSending={isSending}
            isStopped={isStopped}
            onPromptSent={handleSend}
            onPause={onPause}
            onContinue={onContinue}
          />
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
