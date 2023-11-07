import React, { useState, useEffect, ChangeEvent, KeyboardEvent, useRef } from "react";
import { Evo } from "@evo-ninja/agents";
import ReactMarkdown from "react-markdown";
import FileSaver from "file-saver";

import { trackMessageSent, trackThumbsFeedback} from './googleAnalytics';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMarkdown } from '@fortawesome/free-brands-svg-icons';
import { faThumbsUp, faThumbsDown, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

import MenuIcon from "./MenuIcon";
import clsx from "clsx";

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
  onSidebarToggleClick: () => void;
}


const WelcomeMessage: React.FC = () => {
  return (
    <div className="WelcomeMessage">
      <div className="WelcomeMessage__Title"><h1>Welcome to Evo Ninja!</h1></div>
      <div className="WelcomeMessage__Content">
        <p>
        Evo is a general agent that can do anything for you by changing personas based on the task it needs to do. You can use it to write code, automate tasks, or even write a book. Just tell Evo what you want and it do it for you.
          Evo is powered by <a href="https://openai.com/blog/openai-api/" target="_blank" rel="noopener noreferrer">OpenAI's API</a>, <a href="
          https://polywrap.io/" target="_blank" rel="noopener noreferrer">Polywrap</a>, and a community of AI agents that collaborate with humans to solve problems.
        </p>
      </div>
    </div>
  );
}
  

const Chat: React.FC<ChatProps> = ({ evo, onMessage, messages, goalEnded, onSidebarToggleClick }: ChatProps) => {
  const samplePrompts = [
    "Fetch the price of ethereum, bitcoin and dogecoin and save them in a file named crypto.csv",
    "Calculate the factorial of 38 and save it to a file factorial.txt",
    "Write a paper about toast and save it as toast.md",
    "How do I cook spaghetti? Write down the recipe to spaghetti.txt",
  ];

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
        const goal = messages.filter((msg) => msg.user === "user")[0].title;
        setEvoItr(evo.run({ goal }));
        return Promise.resolve();
      }

      let messageLog = messages;

      while (evoRunning) {
        if (pausedRef.current || goalEndedRef.current) {
          setStopped(true);
          return Promise.resolve();
        }

        setStopped(false);

        const response = await evoItr.next();

        if (!response.done) {
          const evoMessage = {
            title: response.value.title,
            content: response.value.content,
            user: "evo"
          };
          messageLog = [...messageLog, evoMessage];
          if (!goalEndedRef.current) {
            onMessage(evoMessage);
          }
        }

        if (response.done) {
          setEvoRunning(false);
          setSending(false); // Reset the sending state when done
          return Promise.resolve();
        }
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

  const handleSamplePromptClick = async (prompt: string) => {
    setMessage(prompt);  // Set the message
  };
  const handleSend = async () => {
    onMessage({
      title: message,
      user: "user"
    });
    setSending(true);
    setShowPrompts(false);
    setMessage("");
    setEvoRunning(true);

    if (trackUser) { // Only track if user accepted the disclaimer
      trackMessageSent(message); 
    }
  };

  const handlePause = async () => {
    setPaused(true);
  };

  const handleContinue = async () => {
    setPaused(false);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    console.log(`handleChange: ${event}`);
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

  const exportChatHistory = (format: 'md') => {
    let exportedContent = '';
    if (format === 'md') {
      exportedContent = messages.map((msg) => {
        return `# ${msg.user.toUpperCase()}\n${msg.title}\n${msg.content}\n---\n`;
      }).join('\n');
    }

    // Generate a date-time stamp
    const date = new Date();
    const dateTimeStamp = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;

    const blob = new Blob([exportedContent], { type: 'text/plain;charset=utf-8' });
    FileSaver.saveAs(blob, `evo-ninja-${dateTimeStamp}.md`)
  };

  return (
    <div className="flex h-full flex-col bg-[#0A0A0A] text-white">
      <div>
        <FontAwesomeIcon className="absolute right-2.5 top-2.5 m-2.5 cursor-pointer text-2xl text-orange-600 transition-colors hover:text-orange-700" icon={faMarkdown} onClick={() => exportChatHistory('md')} />
      </div>
      {showPrompts && (
        <div className="SamplePrompts">
          <WelcomeMessage />
          {samplePrompts.map((prompt, index) => (
            <div 
              key={index} 
              className="SamplePromptCard" 
              onClick={() => handleSamplePromptClick(prompt)}
            >
              {prompt}
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-auto p-5 text-left">
        {messages.map((msg, index) => (
          <div key={index} className={`${msg.user}`}>
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
              <div>
                {
                  clickedMsgIndex === index 
                    ? (
                      <>
                        <div>{msg.title}</div>
                        <ReactMarkdown>{msg.content ?? ""}</ReactMarkdown>
                      </>
                    )
                    : (
                      <>
                        <div>{msg.title}</div>
                      </>
                    )
                }
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
        <div className="grid w-full grid-rows-2 p-2.5 py-16">
          {samplePrompts.map((prompt, index) => (
            <div 
              key={index} 
              className="m-1 cursor-pointer rounded-xl border border-neutral-500 bg-neutral-800 p-2.5 text-left text-xs text-neutral-50 transition-all hover:border-red-500" 
              onClick={() => handleSamplePromptClick(prompt)}
            >
              {prompt}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center gap-4 p-4 border-t-2 border-neutral-700">
        {showDisclaimer && (
          <div className="absolute bottom-0 z-50 flex w-4/5 items-center justify-around rounded-t-lg border-2 border-red-500 bg-black p-2.5 text-center text-xs text-white">
            🧠 Hey there! Mind sharing your prompts to help make Evo even better?
            <div className="flex gap-2.5">
              <span className="cursor-pointer px-5 py-2.5 font-bold text-red-500" onClick={handleCloseDisclaimer}>Accept</span>
              <span className="cursor-pointer px-5 py-2.5 font-bold text-white" onClick={handleCloseWithoutTracking}>Decline</span>
            </div>
          </div>
        )}
        <div className="cursor-pointer" onClick={onSidebarToggleClick}>
          <MenuIcon></MenuIcon>
        </div>
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
          <button className="inline-block h-12 cursor-pointer rounded-xl border-none bg-orange-600 px-5 py-2.5 text-center text-neutral-950 shadow-md outline-none transition-all hover:bg-orange-700" onClick={handleSend} disabled={evoRunning || sending}>
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
