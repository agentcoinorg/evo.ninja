import React, { useState, useEffect, ChangeEvent, KeyboardEvent, useRef, useCallback } from "react";
import { Evo } from "@evo-ninja/agents";
import ReactMarkdown from "react-markdown";
import FileSaver from "file-saver";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { InMemoryFile } from "@nerfzael/memory-fs";
import clsx from "clsx";
import SidebarIcon from "./SidebarIcon";
import { useAtom } from "jotai";
import { allowTelemetryAtom, showDisclaimerAtom } from "@/lib/store";
import { ExamplePrompt, examplePrompts } from "@/lib/examplePrompts";

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
  handlePromptAuth: (message: string) => Promise<boolean>
}

const Chat: React.FC<ChatProps> = ({
  evo,
  onMessage,
  messages,
  sidebarOpen,
  overlayOpen,
  onSidebarToggleClick,
  onUploadFiles,
  handlePromptAuth
}: ChatProps) => {
  const [message, setMessage] = useState<string>("");
  const [evoRunning, setEvoRunning] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [evoItr, setEvoItr] = useState<ReturnType<Evo["run"]> | undefined>(
    undefined
  );
  const [stopped, setStopped] = useState<boolean>(false);
  const [showDisclaimer, setShowDisclaimer] = useAtom(showDisclaimerAtom)
  const [,setAllowTelemetry] = useAtom(allowTelemetryAtom)

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
      let stepCounter = 1
      while (evoRunning) {
        setStopped(false);

        const response = await evoItr.next();
        if (response.done) {
          const actionTitle = response.value.value.title
          console.log(response.value)
          if (actionTitle.includes("onGoalAchieved") || actionTitle === "SUCCESS") {
            onMessage({
              title: "## Goal Achieved",
              user: "evo"
            })
          }
          setEvoRunning(false);
          setSending(false);
          setEvoItr(undefined);
          evo.reset();
          break
        }

        onMessage({
          title: `## Step ${stepCounter}`,
          user: "evo"
        })

        if (!response.done) {
          const evoMessage = {
            title: `### Action executed:\n${response.value.title}`,
            content: response.value.content,
            user: "evo"
          };
          messageLog = [...messageLog, evoMessage];
          onMessage(evoMessage);
        }

        stepCounter++
      }
      return Promise.resolve();
    }

    const timer = setTimeout(runEvo, 200);
    return () => clearTimeout(timer);
  }, [evoRunning, evoItr]);

  useEffect(() => {
    localStorage.setItem('showDisclaimer', showDisclaimer.toString());
  }, [showDisclaimer]);

  const handleDisclaimerSelect = (accept: boolean) => {
    setShowDisclaimer(false);
    setAllowTelemetry(accept);
  }

  const handleSamplePromptClick = async (prompt: ExamplePrompt) => {
    if (prompt.files) {
      onUploadFiles(prompt.files);
    }
    setMessage(prompt.prompt);
    handleSend(prompt.prompt);
  };

  const handleSend = async (newMessage?: string) => {
    if (!message && !newMessage) return
    const authorized = await handlePromptAuth(newMessage ?? message)
    if (!authorized) {
      return
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
    const exportedContent = messages.map((msg, i, msgs) => {
      if (msg.user === "user") {
        return `# User\n**Goal:** ${msg.title}\n`
      } else {
        const logMessage = `${msg.title} \n${msg.content ?? ""}`
        // We only append # Evo into the first message from Evo
        if (msgs.slice(0, i).some(m => m.user === "evo")) {
          return logMessage
        } else {
          return `# Evo\n` + logMessage
        }
      }
    }).join('\n');

    // Generate a date-time stamp
    const date = new Date();
    const dateTimeStamp = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;

    const blob = new Blob([exportedContent], { type: 'text/plain;charset=utf-8' });
    FileSaver.saveAs(blob, `evo-ninja-${dateTimeStamp}.md`)
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
        <div className="h-14 p-4 text-lg text-white cursor-pointer hover:opacity-100 opacity-80 transition-all" onClick={onSidebarToggleClick}>
          { sidebarOpen ? <></>: <SidebarIcon /> }
        </div>
        <FontAwesomeIcon className="cursor-pointer" icon={faDownload} onClick={exportChatHistory} />
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
      {showPrompts && (
        <div className="grid w-full grid-rows-2 p-2.5 py-16 self-center w-[100%] max-w-[56rem]">
          {examplePrompts.map((prompt, index) => (
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
        {showDisclaimer && !overlayOpen && (
          <div className="absolute bottom-0 z-50 flex w-4/5 items-center justify-around rounded-t-lg border-2 border-orange-600 bg-black p-2.5 text-center text-xs text-white self-center w-[100%] max-w-[56rem]">
            🧠 Hey there! Mind sharing your prompts to help make Evo even better?
            <div className="flex gap-2.5">
              <span className="cursor-pointer px-5 py-2.5 font-bold text-orange-500" onClick={() => handleDisclaimerSelect(true)}>Accept</span>
              <span className="cursor-pointer px-5 py-2.5 font-bold text-white" onClick={() => handleDisclaimerSelect(false)}>Decline</span>
            </div>
          </div>
        )}
        <input
          type="text"
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter your main goal here..."
          className="mr-2.5 flex-1 rounded border border-neutral-400 bg-neutral-900 p-2.5 text-neutral-50 outline-none transition-all"
          disabled={sending || showDisclaimer} // Disable input while sending or if disclaimer is shown
        />
        {evoRunning && (
          <>
            {
              !paused && (
                <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-500" onClick={handlePause} disabled={!evoRunning || paused}>
                Pause
                </button>
              )
            }
            {
              paused && (
                <>
                  {!stopped && (
                     <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-500" disabled={true}>
                     Pausing
                     </button>
                  )}

                  {stopped && (
                     <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-500" onClick={handleContinue} disabled={evoRunning && !paused}>
                     Paused
                     </button>
                  )}
                </>
              )
            }
          </>
        )}

        {evoRunning ? (
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-black/10 border-l-orange-600" />
        ) : (
          <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-500" onClick={async () => await handleSend()} disabled={evoRunning || sending}>
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
