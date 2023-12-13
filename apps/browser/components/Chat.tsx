import React, {
  useState,
  useEffect,
  ChangeEvent,
  useRef,
  useCallback,
  memo,
} from "react";
import ReactMarkdown from "react-markdown";
import clsx from "clsx";
import { useAtom } from "jotai";
import {
  allowTelemetryAtom,
  showDisclaimerAtom,
  signInModalAtom,
  uploadedFilesAtom,
  welcomeModalAtom,
} from "@/lib/store";
import { ExamplePrompt } from "@/lib/examplePrompts";
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
import Logo from "./Logo";
import Button from "./Button";
import LoadingCircle from "./LoadingCircle";
import Disclaimer from "./Disclaimer";
import useWindowSize from "@/lib/hooks/useWindowSize";
import { useSession } from "next-auth/react";
import { useUploadFiles } from "@/lib/hooks/useUploadFile";

export interface ChatLog {
  title: string;
  content?: string;
  user: string;
  color?: string;
}

export interface ChatProps {
  logs: ChatLog[];
  samplePrompts: ExamplePrompt[];
  isRunning: boolean;
  isStopped: boolean;
  isPaused: boolean;
  isSending: boolean;
  onPause: () => void;
  onContinue: () => void;
  onPromptSent: (prompt: string) => Promise<void>;
}

const chatName = "New Chat";

const Chat: React.FC<ChatProps> = ({
  logs,
  samplePrompts,
  onPromptSent,
  onContinue,
  onPause,
  isPaused,
  isRunning,
  isSending,
  isStopped,
}: ChatProps) => {
  const [message, setMessage] = useState<string>("");
  const [signInModal] = useAtom(signInModalAtom);
  const [welcomeModalSeen] = useAtom(welcomeModalAtom);
  const [showDisclaimer, setShowDisclaimer] = useAtom(showDisclaimerAtom);
  const [, setUploadedFiles] = useAtom(uploadedFilesAtom);
  const { isMobile } = useWindowSize();
  const { open, getInputProps } = useUploadFiles();
  const { data: session } = useSession();
  const shouldShowExamplePromps = !message.length && !logs.length

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const [, setAllowTelemetry] = useAtom(allowTelemetryAtom);

  const handleDisclaimerSelect = (select: boolean) => {
    setAllowTelemetry(select);
    setShowDisclaimer(false);
  };

  const handleSend = async (prompt: string) => {
    await onPromptSent(prompt);
    setMessage("");
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyPress = async (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !isSending) {
      await handleSend(message);
    }
  };

  const handleSamplePromptClick = async (prompt: ExamplePrompt) => {
    if (prompt.files) {
      setUploadedFiles(prompt.files);
    }
    await handleSend(prompt.prompt);
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
  }, [logs, isAtBottom]);

  return (
    <main
      className={clsx("flex h-full w-full flex-col", {
        "items-center justify-center": shouldShowExamplePromps,
      })}
    >
      {shouldShowExamplePromps ? (
        <div className="flex flex-col items-center space-y-2">
          <Logo wordmark={false} className="w-16" />
          <h1 className="text-2xl font-bold">What's your goal today?</h1>
        </div>
      ) : (
        <>
          <div className="flex h-20 items-center justify-center border-b-2 border-zinc-800 md:h-12">
            <div>{chatName}</div>
          </div>
          <div
            ref={listContainerRef}
            onScroll={handleScroll}
            className="w-full flex-1 items-center space-y-6 overflow-y-auto overflow-x-clip px-2 py-3 text-left"
          >
            {logs.map((msg, index) => {
              return (
                <div
                  key={index}
                  className={`${msg.user} m-auto w-full max-w-[56rem] self-center`}
                >
                  <div className="group relative flex w-full animate-slide-down items-start space-x-3 rounded-lg p-2 pb-10 text-white opacity-0 transition-colors duration-300 ">
                    {msg.user === "evo" ? (
                      <Logo wordmark={false} className="!w-8 !min-w-[2rem]" />
                    ) : (
                      <>
                        {session?.user.image && session?.user.email ? (
                          <img
                            src={session?.user.image}
                            className="h-8 w-8 rounded-full bg-yellow-500"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-yellow-500" />
                        )}
                      </>
                    )}
                    <div className="max-w-[calc(100vw-84px)] space-y-2 pt-1 md:max-w-[49rem]">
                      {index === 0 || logs[index - 1].user !== msg.user ? (
                        <div className="SenderName font-medium">
                          {session?.user.name && !msg.user.includes("evo")
                            ? session?.user.name
                            : msg.user.charAt(0).toUpperCase() +
                              msg.user.slice(1)}
                        </div>
                      ) : null}
                      <div className="prose prose-invert w-full max-w-none">
                        <ReactMarkdown>{msg.title.toString()}</ReactMarkdown>
                        <ReactMarkdown>
                          {msg.content?.toString() ?? ""}
                        </ReactMarkdown>
                      </div>
                      {msg.user === "evo" && isRunning && isSending && (
                        <div className="flex items-center space-x-2 text-cyan-500">
                          <LoadingCircle />
                          <div className="group flex cursor-pointer items-center space-x-2 text-cyan-500 transition-all duration-500 hover:text-cyan-700">
                            <div className="group-hover:underline">
                              Predicting best approach...
                            </div>
                            <Button
                              variant="icon"
                              className="!text-current !transition-none"
                            >
                              <CaretCircleRight size={20} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-1 left-9 hidden animate-fade-in space-x-0.5 group-hover:flex">
                      {msg.user === "evo" ? (
                        <>
                          <Button variant="icon">
                            <CopySimple
                              size={16}
                              className="fill-currentColor"
                            />
                          </Button>
                          <Button variant="icon">
                            <ThumbsUp size={16} className="fill-currentColor" />
                          </Button>
                          <Button variant="icon">
                            <ThumbsDown
                              size={16}
                              className="fill-currentColor"
                            />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="icon">
                            <PencilSimple
                              size={16}
                              className="fill-currentColor"
                            />
                          </Button>
                          <Button variant="icon">
                            <CopySimple
                              size={16}
                              className="fill-currentColor"
                            />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <div
        className={clsx(
          "mt-4 flex w-full space-y-4",
          shouldShowExamplePromps
            ? "flex-col-reverse space-y-reverse px-4 md:px-8 lg:px-4"
            : "mx-auto max-w-[56rem] flex-col px-4"
        )}
      >
        {!message.length && !logs.length && (
          <div className="flex flex-col items-center space-y-3">
            <h2 className="w-full text-center font-normal">
              Not sure where to start?{` `}
              {isMobile && <br />}
              <span className="text-sm md:text-base">
                Try asking one of these:
              </span>
            </h2>
            <div className="flex w-full max-w-[56rem] flex-wrap items-center justify-center self-center">
              {samplePrompts.map((prompt, index) => (
                <div
                  key={index}
                  className={clsx(
                    "m-1 cursor-pointer rounded-lg  border-2 bg-zinc-900/50 p-2.5 text-xs text-zinc-400 transition-all duration-300 ease-in-out hover:bg-cyan-600 hover:text-white",
                    shouldShowExamplePromps
                      ? "border-zinc-700"
                      : "w-[calc(100%-1.5rem)] border-zinc-800"
                  )}
                  onClick={() => handleSamplePromptClick(prompt)}
                >
                  {prompt.prompt}
                </div>
              ))}
            </div>
          </div>
        )}
        <div
          className={clsx(
            "mb-4 flex w-full items-center justify-center gap-4 self-center",
            shouldShowExamplePromps ? "max-w-[42rem] " : "max-w-[56rem]"
          )}
        >
          <TextField
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            placeholder="Ask Evo anything..."
            className="!rounded-lg !p-4 !pl-12"
            leftAdornment={
              <>
                <Button variant="icon" className="!text-white" onClick={open}>
                  <UploadSimple size={20} />
                </Button>
                <input {...getInputProps()} />
              </>
            }
            rightAdornment={
              <ChatInputButton
                evoRunning={isRunning}
                paused={isPaused}
                sending={isSending}
                stopped={isStopped}
                message={message}
                handlePause={onPause}
                handleContinue={onContinue}
                handleSend={async () => await handleSend(message)}
              />
            }
            rightAdornmentClassnames="!right-3"
            disabled={isSending || showDisclaimer} // Disable input while sending or if disclaimer is shown
          />
        </div>
      </div>

      {showDisclaimer && !signInModal && welcomeModalSeen && (
        <Disclaimer handleDisclaimerSelect={handleDisclaimerSelect} />
      )}
      <a
        className="fixed bottom-4 right-4 z-10 hidden cursor-pointer rounded-full border-2 border-zinc-500 bg-zinc-700 p-1 shadow hover:bg-zinc-600 hover:shadow-lg md:block"
        href="https://discord.gg/r3rwh69cCa"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image alt="Support" src="/questionmark.svg" width={12} height={12} />
      </a>
    </main>
  );
};

export default memo(Chat);
