import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import SidebarIcon from "./SidebarIcon";
import { useAtom } from "jotai";
import { showDisclaimerAtom, sidebarAtom, uploadedFilesAtom } from "@/lib/store";
import { ExamplePrompt } from "@/lib/examplePrompts";
import Disclaimer from "./modals/Disclaimer";
import { exportChatHistory } from "@/lib/exportChatHistory";

export interface ChatMessage {
  title: string;
  content?: string;
  user: string;
  color?: string;
}

export interface ChatProps {
  messages: ChatMessage[];
  samplePrompts: ExamplePrompt[];
  isRunning: boolean;
  isStopped: boolean;
  isPaused: boolean;
  isSending: boolean;
  onPause: () => void;
  onContinue: () => void;
  onPromptSent: (prompt: string) => void;
}

const Chat: React.FC<ChatProps> = ({
  messages,
  samplePrompts,
  onPromptSent,
  onContinue,
  onPause,
  isPaused,
  isRunning,
  isSending,
  isStopped
}: ChatProps) => {
  const [message, setMessage] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarAtom);

  const [showDisclaimer, setShowDisclaimer] = useAtom(showDisclaimerAtom)
  const [, setUploadedFiles] = useAtom(uploadedFilesAtom)

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const handleSend = (prompt: string) => {
    onPromptSent(prompt);
    setMessage("")
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !isSending) {
      handleSend(message)
    }
  };

  const handleSamplePromptClick = async (prompt: ExamplePrompt) => {
    if (prompt.files) {
      setUploadedFiles(prompt.files);
    }
    handleSend(prompt.prompt)
  };

  const handleScroll = useCallback(() => {
    // Detect if the user is at the bottom of the list
    const container = listContainerRef.current;
    if (container) {
      const isScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight;
      setIsAtBottom(isScrolledToBottom);
    }
  }, []);

  useEffect(() => {
    const container = listContainerRef.current;
    if (container) {
      // Add scroll event listener
      container.addEventListener('scroll', handleScroll);
    }

    // Clean up listener
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    // If the user is at the bottom, scroll to the new item
    if (isAtBottom) {
      listContainerRef.current?.scrollTo({
        top: listContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isAtBottom]);

  return (
    <div className="flex h-full flex-col bg-[#0A0A0A] text-white">
      <div className="flex justify-between items-center p-4 border-b-2 border-neutral-700">
        <div className="h-14 p-4 text-lg text-white cursor-pointer hover:opacity-100 opacity-80 transition-all" onClick={() => setSidebarOpen(!sidebarOpen)}>
          { sidebarOpen ? <></>: <SidebarIcon /> }
        </div>
        <FontAwesomeIcon className="cursor-pointer" icon={faDownload} onClick={() => exportChatHistory(messages)} />
      </div>
      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-5 text-left items-center"
      >
        {messages.map((msg, index) => (
          <div key={index} className={`${msg.user} m-auto self-center w-[100%] max-w-[56rem]`}>
            {index === 0 || messages[index - 1].user !== msg.user ? (
              <div className="SenderName">{msg.user.toUpperCase()}</div>
            ) : null}
            <div 
              className={clsx(
                "my-1 rounded border border-transparent px-4 py-2.5 transition-all hover:border-orange-600",
                msg.user === "user" ? "bg-blue-500": "bg-neutral-900")
              }
            >
              <div className="prose prose-invert">
                <ReactMarkdown>{msg.title.toString()}</ReactMarkdown>
                <ReactMarkdown>{msg.content?.toString() ?? ""}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>
      {samplePrompts.length && (
        <div className="grid w-full grid-rows-2 p-2.5 py-16 self-center w-[100%] max-w-[56rem]">
          {samplePrompts.map((prompt, index) => (
            <div 
              key={index} 
              className="m-1 cursor-pointer rounded-xl border border-neutral-500 bg-neutral-800 p-2.5 text-left text-xs text-neutral-50 transition-all hover:border-orange-500" 
              onClick={() => handleSamplePromptClick(prompt)}
            >
              {prompt.prompt}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center gap-4 p-4 mb-4 self-center w-[100%] max-w-[56rem]">
        <Disclaimer isOpen={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
        <input
          type="text"
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter your main goal here..."
          className="mr-2.5 flex-1 rounded border border-neutral-400 bg-neutral-900 p-2.5 text-neutral-50 outline-none transition-all"
          disabled={isSending || showDisclaimer}
        />
        {isRunning && (
          <>
            {
              !isPaused && (
                <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-500" onClick={onPause} disabled={!isRunning || isPaused}>
                Pause
                </button>
              )
            }
            {
              isPaused && (
                <>
                  {!isStopped && (
                     <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-500" disabled={true}>
                     Pausing
                     </button>
                  )}

                  {isStopped && (
                     <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-500" onClick={onContinue} disabled={isRunning && !isPaused}>
                     Paused
                     </button>
                  )}
                </>
              )
            }
          </>
        )}

        {isRunning ? (
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-black/10 border-l-orange-600" />
        ) : (
          <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-500" onClick={() => handleSend(message)} disabled={isRunning || isSending}>
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
