import {
  sidebarAtom,
  showDisclaimerAtom,
  errorAtom,
  localOpenAiApiKeyAtom,
  showAccountModalAtom,
  chatIdAtom
} from "@/lib/store";
import { useEvoService } from "@/lib/hooks/useEvoService";
import { exportChatHistory } from "@/lib/exportChatHistory";
import SidebarIcon from "@/components/SidebarIcon";
import ExamplePrompts from "@/components/ExamplePrompts";
import ChatLogs from "@/components/ChatLogs";
import Disclaimer from "@/components/modals/Disclaimer";
import React, { useState, ChangeEvent } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { useAtom } from "jotai";

export interface ChatLog {
  title: string;
  content?: string;
  user: string;
  color?: string;
}

export interface ChatProps {
  isAuthenticated: boolean;
  onCreateChat: (chatId: string) => void;
}

const Chat: React.FC<ChatProps> =({
  isAuthenticated,
  onCreateChat
}: ChatProps) => {
  const [chatId] = useAtom(chatIdAtom);
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarAtom);
  const [showDisclaimer, setShowDisclaimer] = useAtom(showDisclaimerAtom)
  const [, setError] = useAtom(errorAtom);
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [, setAccountModalOpen] = useAtom(showAccountModalAtom);

  const [message, setMessage] = useState<string>("");

  const {
    logs,
    isLoading,
    isStarting,
    isRunning,
    handleStart
  } = useEvoService(
    chatId,
    isAuthenticated,
    onCreateChat
  );

  const handleGoalSubmit = (goal: string) => {
    if (!goal) {
      setError("Please enter a goal.");
      return;
    }

    if (isStarting || isRunning) {
      setError("Goal is already in progress.");
      return;
    }

    const firstTimeUser = !localOpenAiApiKey && !isAuthenticated;
    if (firstTimeUser) {
      setError("Please login or add an OpenAI API key.");
      setAccountModalOpen(true);
      return;
    }

    handleStart(goal);
    setMessage("");
  }

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyPress = async (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !isStarting && !isRunning) {
      await handleGoalSubmit(message)
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0A0A0A] text-white">
      <div className="flex justify-between items-center p-4 border-b-2 border-neutral-700">
        <div className="h-14 p-4 text-lg text-white cursor-pointer hover:opacity-100 opacity-80 transition-all" onClick={() => setSidebarOpen(!sidebarOpen)}>
          { sidebarOpen ? <></>: <SidebarIcon /> }
        </div>
        {logs && <FontAwesomeIcon className="cursor-pointer" icon={faDownload} onClick={() => exportChatHistory(logs)} />}
      </div>

      <ChatLogs logs={logs ?? []} />

      {(!logs || logs.length === 0) && !isLoading &&
        <ExamplePrompts onClick={async (prompt: string) => await handleGoalSubmit(prompt)} />
      }
      <div className="flex items-center justify-center gap-4 p-4 mb-4 self-center w-[100%] max-w-[56rem]">
        <Disclaimer isOpen={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
        <input
          type="text"
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter your main goal here..."
          className="mr-2.5 flex-1 rounded border border-neutral-400 bg-neutral-900 p-2.5 text-neutral-50 outline-none transition-all"
          disabled={isStarting || isRunning || showDisclaimer}
        />
        {isRunning ? (
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-black/10 border-l-orange-600" />
        ) : (
          <button
            className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-500"
            onClick={() => handleGoalSubmit(message)}
            disabled={isStarting || isRunning}>
            Start
          </button>
        )}
      </div>
      <a
        className="cursor-pointer fixed bottom-0 right-0 mx-4 my-2"
        href="https://discord.gg/r3rwh69cCa"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FontAwesomeIcon icon={faQuestionCircle} title="Questions?" />
      </a>
    </div>
  );
};

export default Chat;
