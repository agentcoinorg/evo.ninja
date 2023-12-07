import React, {
  useState,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  useRef,
  useCallback,
} from "react";
import { Evo } from "@evo-ninja/agents";
import ReactMarkdown from "react-markdown";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";

import clsx from "clsx";
import { useAtom } from "jotai";
import { allowTelemetryAtom, showDisclaimerAtom, sidebarAtom, uploadedFilesAtom } from "@/lib/store";
import { ExamplePrompt, examplePrompts } from "@/lib/examplePrompts";
import TextField from "./TextField";
import { UploadSimple } from "@phosphor-icons/react";
import ChatInputButton from "./ChatInputButton";
import Disclaimer from "./modals/Disclaimer";

export interface ChatMessage {
  title: string;
  content?: string;
  user: string;
  color?: string;
}

export interface ChatProps {
  messages: ChatMessage[];
  samplePrompts: ExamplePrompt[] | undefined;
  isRunning: boolean;
  isStopped: boolean;
  isPaused: boolean;
  isSending: boolean;
  onPause: () => void;
  onContinue: () => void;
  onPromptSent: (prompt: string) => Promise<void>;
}

const chat_name = "New Chat";

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

  const handleSend = async (prompt: string) => {
    await onPromptSent(prompt);
    setMessage("")
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyPress = async (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !isSending) {
      await handleSend(message)
    }
  };

  const handleSamplePromptClick = async (prompt: ExamplePrompt) => {
    if (prompt.files) {
      setUploadedFiles(prompt.files);
    }
    await handleSend(prompt.prompt)
  };

  const handleScroll = useCallback(() => {
    // Detect if the user is at the bottom of the list
    const container = listContainerRef.current;
    if (container) {
      const isScrolledToBottom =
        container.scrollHeight - container.scrollTop <= container.clientHeight;
      setIsAtBottom(isScrolledToBottom);
    }
  }, []);

  useEffect(() => {
    const container = listContainerRef.current;
    if (container) {
      // Add scroll event listener
      container.addEventListener("scroll", handleScroll);
    }

    // Clean up listener
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    // If the user is at the bottom, scroll to the new item
    if (isAtBottom) {
      listContainerRef.current?.scrollTo({
        top: listContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isAtBottom]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center justify-center border-b-2 border-zinc-800">
        <div>{chat_name}</div>
        {/* <FontAwesomeIcon
          className="cursor-pointer"
          icon={faDownload}
          onClick={exportChatHistory}
        /> */}
      </div>
      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        className="flex-1 items-center overflow-auto p-5 text-left"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${msg.user} m-auto w-[100%] max-w-[56rem] self-center`}
          >
            {index === 0 || messages[index - 1].user !== msg.user ? (
              <div className="SenderName">{msg.user.toUpperCase()}</div>
            ) : null}
            <div
              className={clsx(
                "my-1 rounded border border-transparent px-4 py-2.5 transition-all hover:border-orange-600",
                msg.user === "user" ? "bg-blue-500" : "bg-zinc-900"
              )}
            >
              <div className="prose prose-invert">
                <ReactMarkdown>{msg.title.toString()}</ReactMarkdown>
                <ReactMarkdown>{msg.content?.toString() ?? ""}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>
      {samplePrompts && (
        <div className="grid w-[100%] w-full max-w-[56rem] grid-rows-2 self-center p-2.5 py-16">
          {samplePrompts.map((prompt, index) => (
            <div
              key={index}
              className="m-1 cursor-pointer rounded-xl border border-zinc-500 bg-zinc-800 p-2.5 text-left text-xs text-zinc-50 transition-all hover:border-cyan-400"
              onClick={() => handleSamplePromptClick(prompt)}
            >
              {prompt.prompt}
            </div>
          ))}
        </div>
      )}
      <div className="mb-4 flex w-[100%] max-w-[56rem] items-center justify-center gap-4 self-center p-4">
        <Disclaimer isOpen={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
        <TextField
          type="text"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          placeholder="Ask Evo anything..."
          className="!rounded-lg !p-4 !pl-12"
          leftAdornment={<UploadSimple color="white" size={24} />}
          rightAdornment={
            <ChatInputButton
              evoRunning={isRunning}
              paused={isPaused}
              sending={isSending}
              stopped={isStopped}
              handlePause={onPause}
              handleContinue={onContinue}
              handleSend={async () => await handleSend(message)}
            />
          }
          rightAdornmentClassnames="!right-3"
          disabled={isSending || showDisclaimer} // Disable input while sending or if disclaimer is shown
        />
      </div>
      <a
        className="fixed bottom-0 right-0 mx-4 my-2 cursor-pointer"
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
