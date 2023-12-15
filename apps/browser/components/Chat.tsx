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
import { UploadSimple } from "@phosphor-icons/react";
import ChatInputButton from "./ChatInputButton";
import Image from "next/image";
import Logo from "./Logo";
import Button from "./Button";
import LoadingCircle from "./LoadingCircle";
import Disclaimer from "./Disclaimer";
import useWindowSize from "@/lib/hooks/useWindowSize";
import { useSession } from "next-auth/react";
import { useUploadFiles } from "@/lib/hooks/useUploadFile";
import AvatarBlockie from "./AvatarBlockie";

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
  const shouldShowExamplePrompts = logs.length === 0;
  let shownEvo = 0;

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const [allowTelemetry, setAllowTelemetry] = useAtom(allowTelemetryAtom);

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
    await handleSend(prompt.prompt);
    if (prompt.files) {
      setUploadedFiles(prompt.files);
    }
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

  useEffect(() => {
    if (allowTelemetry && showDisclaimer) {
      setShowDisclaimer(false);
    }
  }, [allowTelemetry, showDisclaimer]);

  return (
    <main
      className={clsx("flex h-full w-full flex-col", {
        "items-center justify-center": shouldShowExamplePrompts,
      })}
    >
      {shouldShowExamplePrompts ? (
        <Logo wordmark={false} className="mb-16 w-16" />
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
              const isEvo = msg.user === "evo";
              if (isEvo) {
                shownEvo++;
              }
              return (
                <div
                  key={index}
                  className={`${msg.user} m-auto w-full max-w-[56rem] self-center`}
                >
                  <div className="animate-slide-down group relative flex w-full items-start space-x-3 rounded-lg p-2 text-white opacity-0 transition-colors duration-300 ">
                    <div className="!w-8 !min-w-[2rem]">
                      {isEvo && shownEvo < 2 ? (
                        <Logo wordmark={false} className="w-full" chatAvatar />
                      ) : msg.user !== "evo" ? (
                        <>
                          {session?.user.image && session?.user.email ? (
                            <img
                              src={session?.user.image}
                              className="w-full rounded-full bg-cyan-600"
                            />
                          ) : !session?.user.email ? (
                            <AvatarBlockie
                              address={
                                "0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8"
                              }
                              size={32}
                            />
                          ) : (
                            <div className="w-full rounded-full bg-cyan-600" />
                          )}
                        </>
                      ) : null}
                    </div>
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
          shouldShowExamplePrompts
            ? "flex-col-reverse space-y-reverse px-4 md:px-8 lg:px-4"
            : "mx-auto max-w-[56rem] flex-col px-4"
        )}
      >
        {shouldShowExamplePrompts && (
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
                    shouldShowExamplePrompts
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
            shouldShowExamplePrompts ? "max-w-[42rem] " : "max-w-[56rem]"
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
    </main>
  );
};

export default memo(Chat);
