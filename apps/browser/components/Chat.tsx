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
import FileSaver from "file-saver";
import { InMemoryFile } from "@nerfzael/memory-fs";
import clsx from "clsx";
import { useAtom } from "jotai";
import { allowTelemetryAtom, showDisclaimerAtom } from "@/lib/store";
import { ExamplePrompt, examplePrompts } from "@/lib/examplePrompts";
import TextField from "./TextField";
import {
  CaretCircleRight,
  CopySimple,
  PencilSimple,
  ThumbsDown,
  ThumbsUp,
  UploadSimple,
} from "@phosphor-icons/react";
import ChatInputButton from "./ChatInputButton";
import Image from "next/image";
import AvatarBlockie from "./AvatarBlockie";
import Logo from "./Logo";
import Button from "./Button";
import LoadingCircle from "./LoadingCircle";
import Disclaimer from "./Disclaimer";

export interface ChatMessage {
  title: string;
  content?: string;
  user: string;
  color?: string;
}

export interface ChatProps {
  evo: Evo;
  onMessage: (message: ChatMessage) => void;
  messages: ChatMessage[];
  sidebarOpen: boolean;
  overlayOpen: boolean;
  onSidebarToggleClick: () => void;
  onUploadFiles: (files: InMemoryFile[]) => void;
  handlePromptAuth: (message: string) => Promise<boolean>;
}

const chat_name = "New Chat";

const Chat: React.FC<ChatProps> = ({
  evo,
  onMessage,
  messages,
  sidebarOpen,
  overlayOpen,
  onSidebarToggleClick,
  onUploadFiles,
  handlePromptAuth,
}: ChatProps) => {
  const [message, setMessage] = useState<string>("");
  const [evoRunning, setEvoRunning] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [evoItr, setEvoItr] = useState<ReturnType<Evo["run"]> | undefined>(
    undefined
  );
  const [stopped, setStopped] = useState<boolean>(false);
  const [showDisclaimer, setShowDisclaimer] = useAtom(showDisclaimerAtom);
  const [, setAllowTelemetry] = useAtom(allowTelemetryAtom);

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showPrompts, setShowPrompts] = useState<boolean>(true);

  useEffect(() => {
    const runEvo = async () => {
      if (!evoRunning) {
        return Promise.resolve();
      }

      // Create a new iteration thread
      if (!evoItr) {
        const userMsgs = messages.filter((msg) => msg.user === "user");
        const goal = userMsgs[userMsgs.length - 1].title;
        setEvoItr(evo.run({ goal }));
        return Promise.resolve();
      }

      let messageLog = messages;
      let stepCounter = 1;
      while (evoRunning) {
        setStopped(false);

        const response = await evoItr.next();
        if (response.done) {
          const actionTitle = response.value.value.title;
          console.log(response.value);
          if (
            actionTitle.includes("onGoalAchieved") ||
            actionTitle === "SUCCESS"
          ) {
            onMessage({
              title: "## Goal Achieved",
              user: "evo",
            });
          }
          setEvoRunning(false);
          setSending(false);
          setEvoItr(undefined);
          evo.reset();
          break;
        }

        onMessage({
          title: `## Step ${stepCounter}`,
          user: "evo",
        });

        if (!response.done) {
          const evoMessage = {
            title: `### Action executed:\n${response.value.title}`,
            content: response.value.content,
            user: "evo",
          };
          messageLog = [...messageLog, evoMessage];
          onMessage(evoMessage);
        }

        stepCounter++;
      }
      return Promise.resolve();
    };

    const timer = setTimeout(runEvo, 200);
    return () => clearTimeout(timer);
  }, [evoRunning, evoItr]);

  useEffect(() => {
    localStorage.setItem("showDisclaimer", showDisclaimer.toString());
  }, [showDisclaimer]);

  const handleDisclaimerSelect = (accept: boolean) => {
    setShowDisclaimer(false);
    setAllowTelemetry(accept);
  };

  const handleSamplePromptClick = async (prompt: ExamplePrompt) => {
    if (prompt.files) {
      onUploadFiles(prompt.files);
    }
    setMessage(prompt.prompt);
    handleSend(prompt.prompt);
  };

  const handleSend = async (newMessage?: string) => {
    if (!message && !newMessage) return;
    const authorized = await handlePromptAuth(newMessage ?? message);
    if (!authorized) {
      return;
    }
    onMessage({
      title: newMessage || message,
      user: "user",
    });
    setSending(true);
    setShowPrompts(false);
    setMessage("");
    setEvoRunning(true);
  };

  const handlePause = async () => {
    setPaused(true);
  };

  const handleContinue = async () => {
    setPaused(false);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !sending) {
      handleSend();
    }
  };

  const exportChatHistory = () => {
    const exportedContent = messages
      .map((msg, i, msgs) => {
        if (msg.user === "user") {
          return `# User\n**Goal:** ${msg.title}\n`;
        } else {
          const logMessage = `${msg.title} \n${msg.content ?? ""}`;
          // We only append # Evo into the first message from Evo
          if (msgs.slice(0, i).some((m) => m.user === "evo")) {
            return logMessage;
          } else {
            return `# Evo\n` + logMessage;
          }
        }
      })
      .join("\n");

    // Generate a date-time stamp
    const date = new Date();
    const dateTimeStamp = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}_${date
      .getHours()
      .toString()
      .padStart(2, "0")}-${date.getMinutes().toString().padStart(2, "0")}-${date
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;

    const blob = new Blob([exportedContent], {
      type: "text/plain;charset=utf-8",
    });
    FileSaver.saveAs(blob, `evo-ninja-${dateTimeStamp}.md`);
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
        className="flex-1 items-center space-y-6 overflow-auto p-5 text-left"
      >
        {messages.map((msg, index) => {
          return (
            <div
              key={index}
              className={`${msg.user} m-auto w-full max-w-[56rem] self-center`}
            >
              <div className="animate-slide-down group relative flex w-full items-start space-x-4 rounded-lg p-2 pb-10 text-white opacity-0 transition-colors duration-300 ">
                {msg.user === "evo" ? (
                  <Logo wordmark={false} className="!w-8" />
                ) : (
                  <AvatarBlockie
                    address="0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8"
                    size={32}
                    className="border-2 border-zinc-900"
                  />
                )}
                <div className="space-y-2 pt-1">
                  {index === 0 || messages[index - 1].user !== msg.user ? (
                    <div className="SenderName font-medium">
                      {msg.user.charAt(0).toUpperCase() + msg.user.slice(1)}
                    </div>
                  ) : null}
                  <div className="prose prose-invert max-w-[49rem]">
                    <ReactMarkdown>{msg.title.toString()}</ReactMarkdown>
                    <ReactMarkdown>
                      {msg.content?.toString() ?? ""}
                    </ReactMarkdown>
                  </div>
                  {msg.user === "evo" && evoRunning && sending && (
                    <div className="flex items-center space-x-2 text-cyan-500">
                      <LoadingCircle />
                      <div className="group flex cursor-pointer items-center space-x-2 text-cyan-500 transition-colors duration-500 hover:text-cyan-700">
                        <div className="group-hover:underline">
                          Predicting best approach...
                        </div>
                        <Button
                          variant="icon"
                          className="text-current transition-none"
                        >
                          <CaretCircleRight size={20} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="animate-fade-in absolute bottom-1 left-9 hidden space-x-0.5 group-hover:flex">
                  {msg.user === "evo" ? (
                    <>
                      <Button variant="icon">
                        <CopySimple size={16} className="fill-currentColor" />
                      </Button>
                      <Button variant="icon">
                        <ThumbsUp size={16} className="fill-currentColor" />
                      </Button>
                      <Button variant="icon">
                        <ThumbsDown size={16} className="fill-currentColor" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="icon">
                        <PencilSimple size={16} className="fill-currentColor" />
                      </Button>
                      <Button variant="icon">
                        <CopySimple size={16} className="fill-currentColor" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showPrompts && (
        <div className="grid w-[100%] w-full max-w-[56rem] grid-rows-2 self-center p-2.5 py-8">
          {examplePrompts.map((prompt, index) => (
            <div
              key={index}
              className="m-1 cursor-pointer rounded-lg border-2 border-zinc-700 bg-zinc-900/80 p-2.5 text-left text-xs text-zinc-50 transition-all hover:border-cyan-400"
              onClick={() => handleSamplePromptClick(prompt)}
            >
              {prompt.prompt}
            </div>
          ))}
        </div>
      )}
      <div className="mb-4 flex w-[100%] max-w-[56rem] items-center justify-center gap-4 self-center p-4">
        {showDisclaimer && !overlayOpen && (
          <Disclaimer handleDisclaimerSelect={handleDisclaimerSelect} />
        )}
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
              evoRunning={evoRunning}
              paused={paused}
              sending={sending}
              stopped={stopped}
              handlePause={handlePause}
              handleContinue={handleContinue}
              handleSend={handleSend}
            />
          }
          rightAdornmentClassnames="!right-3"
          disabled={sending || showDisclaimer} // Disable input while sending or if disclaimer is shown
        />
      </div>
      <a
        className="fixed bottom-4 right-4 z-10 cursor-pointer rounded-full border-2 border-zinc-500 bg-zinc-700 p-1 shadow hover:bg-zinc-600 hover:shadow-lg"
        href="https://discord.gg/r3rwh69cCa"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image alt="Support" src="/questionmark.svg" width={12} height={12} />
      </a>
    </div>
  );
};

export default Chat;
