import React, { useState, useEffect, ChangeEvent, KeyboardEvent, useRef } from "react";
import { Evo } from "@evo-ninja/agents";
import ReactMarkdown from "react-markdown";
import FileSaver from "file-saver";

import { trackMessageSent, trackThumbsFeedback} from './googleAnalytics';
import { ExamplePrompt, examplePrompts } from "../examplePrompts";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { faThumbsUp, faThumbsDown, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { InMemoryFile } from "@nerfzael/memory-fs";

import MenuIcon from "./MenuIcon";
import clsx from "clsx";
import SidebarIcon from "./SidebarIcon";

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
  goalEnded: boolean;
  sidebarOpen: boolean;
  onSidebarToggleClick: () => void;
  onUploadFiles: (files: InMemoryFile[]) => void;
}

const Chat: React.FC<ChatProps> = ({ evo, onMessage, messages, goalEnded, onSidebarToggleClick, sidebarOpen, onUploadFiles }: ChatProps) => {

  const [message, setMessage] = useState<string>("");
  const [evoRunning, setEvoRunning] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [evoItr, setEvoItr] = useState<ReturnType<Evo["run"]> | undefined>(
    undefined
  );
  const [stopped, setStopped] = useState<boolean>(false);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(
    localStorage.getItem('showDisclaimer') !== 'false'
  );
  const [trackUser, setTrackUser] = useState<boolean>(
    localStorage.getItem('trackUser') === 'true'
  );
  const [clickedMsgIndex, setClickedMsgIndex] = useState<number | null>(null);

  const [hasUpvoted, setHasUpvoted] = useState<boolean>(false);
  const [hasDownvoted, setHasDownvoted] = useState<boolean>(false);
  const [showEvoNetPopup, setShowEvoNetPopup] = useState<boolean>(false);
  const [showPrompts, setShowPrompts] = useState<boolean>(true);

  const pausedRef = useRef(paused);
  useEffect(() => {
      pausedRef.current = paused;
  }, [paused]);

  const goalEndedRef = useRef(paused);
  useEffect(() => {
    goalEndedRef.current = goalEnded;
  }, [goalEnded]);

  useEffect(() => {
    if (goalEnded) {
      setPaused(true);
      setEvoRunning(false);
      setSending(false);
      setShowEvoNetPopup(true);
    }
  }, [goalEnded]);

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
        if (pausedRef.current || goalEndedRef.current) {
          setStopped(true);
          return Promise.resolve();
        }

        setStopped(false);

        const response = await evoItr.next();

        if (response.done) {
          onMessage({
            title: "## Goal Achieved",
            user: "evo"
          })
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
          if (!goalEndedRef.current) {
            onMessage(evoMessage);
          }
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

  useEffect(() => {
    localStorage.setItem('trackUser', trackUser.toString());
  }, [trackUser]);

  const handleCloseDisclaimer = () => {
    setShowDisclaimer(false);
    setTrackUser(true);  // User accepted disclaimer, enable tracking
  };

  const handleCloseWithoutTracking = () => {
    setShowDisclaimer(false);
    setTrackUser(false); // User did not accept disclaimer, disable tracking
  };

  const handleSamplePromptClick = async (prompt: ExamplePrompt) => {
    if (prompt.files) {
      onUploadFiles(prompt.files);
    }
    setMessage(prompt.prompt);
    handleSend(prompt.prompt);
  };
  const handleStart = async () => {
    handleSend();
  }
  const handleSend = async (newMessage?: string) => {
    onMessage({
      title: newMessage || message,
      user: "user"
    });
    setSending(true);
    setShowPrompts(false);
    setMessage("");
    setEvoRunning(true);

    if (trackUser) { // Only track if user accepted the disclaimer
      trackMessageSent(newMessage || message); 
    }
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

  const handleThumbsUp = () => {
    if (!hasDownvoted) {
      setHasUpvoted(true);
      trackThumbsFeedback('positive');
    }
  };

  const handleThumbsDown = () => {
    if (!hasUpvoted) {
      setHasDownvoted(true);
      trackThumbsFeedback('negative');
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

  return (
    <div className="flex h-full flex-col bg-[#0A0A0A] text-white">
      <div className="flex justify-between items-center p-4 border-b-2 border-neutral-700">
        <div className="h-14 p-4 text-lg text-white cursor-pointer hover:opacity-100 opacity-80 transition-all" onClick={onSidebarToggleClick}>
          { sidebarOpen ? <></>: <SidebarIcon /> }
        </div>
        <FontAwesomeIcon className="cursor-pointer" icon={faDownload} onClick={exportChatHistory} />
      </div>
      <div className="flex-1 overflow-auto p-5 text-left items-center">
        {messages.map((msg, index) => (
          <div key={index} className={`${msg.user} m-auto self-center w-[100%] max-w-[56rem]`}>
            {index === 0 || messages[index - 1].user !== msg.user ? (
              <div className="SenderName">{msg.user.toUpperCase()}</div>
            ) : null}
            <div 
              className={clsx(
                "my-1 rounded border border-transparent px-4 py-2.5 transition-all hover:border-orange-600",
                msg.user === "user" ? "bg-blue-500": "bg-neutral-900",
                clickedMsgIndex === index ? "border-orange-600" : "")
              } 
              onClick={() => setClickedMsgIndex(index === clickedMsgIndex ? null : index)}
            >
              <div className="prose prose-invert">
                <ReactMarkdown>{msg.title}</ReactMarkdown>
                <ReactMarkdown>{msg.content ?? ""}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {goalEnded && (
          <div className="my-4 flex flex-col items-center">
            <div className="mb-2 text-xl">Provide Feedback</div>
            <div className="flex justify-center gap-4">
              <FontAwesomeIcon 
                icon={faThumbsUp} 
                onClick={handleThumbsUp} 
                className={clsx(hasUpvoted ? 'text-orange-600' : '')} 
              />
              <FontAwesomeIcon 
                icon={faThumbsDown} 
                onClick={handleThumbsDown} 
                className={clsx(hasUpvoted ? 'text-orange-600' : '')} 
              />
            </div>
            <div>
              <a
                className="mt-2.5 inline-block text-orange-600 underline"
                href="https://forms.gle/nidFArD7aPzYL5PQ7"
                target="_blank"
                rel="noopener noreferrer"
              >
                Fill a Detailed Feedback Form
              </a>
            </div>
          </div>
        )}
      </div>
      {showPrompts && (
        <div className="grid w-full grid-rows-2 p-2.5 py-16 self-center w-[100%] max-w-[56rem]">
          {examplePrompts.map((prompt, index) => (
            <div 
              key={index} 
              className="m-1 cursor-pointer rounded-xl border border-neutral-500 bg-neutral-800 p-2.5 text-left text-xs text-neutral-50 transition-all hover:border-red-500" 
              onClick={() => handleSamplePromptClick(prompt)}
            >
              {prompt.prompt}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center gap-4 p-4 self-center w-[100%] max-w-[56rem]">
        {showDisclaimer && (
          <div className="absolute bottom-0 z-50 flex w-4/5 items-center justify-around rounded-t-lg border-2 border-red-500 bg-black p-2.5 text-center text-xs text-white">
            🧠 Hey there! Mind sharing your prompts to help make Evo even better?
            <div className="flex gap-2.5">
              <span className="cursor-pointer px-5 py-2.5 font-bold text-red-500" onClick={handleCloseDisclaimer}>Accept</span>
              <span className="cursor-pointer px-5 py-2.5 font-bold text-white" onClick={handleCloseWithoutTracking}>Decline</span>
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
                <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-700" onClick={handlePause} disabled={!evoRunning || paused}>
                Pause
                </button>
              )
            }
            {
              paused && (
                <>
                  {!stopped && (
                     <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-700" disabled={true}>
                     Pausing
                     </button>
                  )}

                  {stopped && (
                     <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-700" onClick={handleContinue} disabled={evoRunning && !paused}>
                     Paused
                     </button>
                  )}
                </>
              )
            }
          </>
        )}

        {evoRunning ? (
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-black/10 border-l-red-500" />
        ) : (
          <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-700" onClick={handleStart} disabled={evoRunning || sending}>
            Start
          </button>
        )}
      </div>

      {showEvoNetPopup && (
        <div
          className="fixed top-0 right-0 w-[300px] bg-[#121212] text-[#f5f5f5] shadow-md border border-[#2b2b30] rounded-lg cursor-pointer transition-opacity duration-300 ease-in-out opacity-80 mt-[55px] mr-[18px] hover:border-[#ff572e] hover:opacity-100"
          onClick={() => window.open('https://forms.gle/Wsjanqiw68DwCLTA9', '_blank')}
        >
          <div className="p-3 text-left text-xs flex items-start justify-between relative">
            <a href="https://forms.gle/Wsjanqiw68DwCLTA9" target="_blank" rel="noopener noreferrer">
              <p>Join Evo-Net! <br /> A community where script writers and AI agents collab on AI tools for specialized tasks.</p>
            </a>
            <div className="absolute top-3 right-3">
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
