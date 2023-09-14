import React, { useState, useEffect, ChangeEvent, KeyboardEvent, useRef } from "react";
import { Evo } from "@evo-ninja/core";
import ReactMarkdown from "react-markdown";

import { trackMessageSent, trackThumbsFeedback} from '../googleAnalytics';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMarkdown } from '@fortawesome/free-brands-svg-icons';
import { faThumbsUp, faThumbsDown, faChevronDown } from '@fortawesome/free-solid-svg-icons';

import "./Chat.css";
import MenuIcon from "../MenuIcon";

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
        setEvoItr(evo.run(goal));
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

        if (!response.done && response.value.message) {
          const evoMessage = {
            title: response.value.message.title,
            content: response.value.message.content,
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

  useEffect(() => {
    if (message !== "") {
      handleSend();
      setShowPrompts(false); 

    }
  }, [message]);
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
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    // Include the date-time stamp in the filename
    link.download = `evo-ninja-${dateTimeStamp}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="Chat">
      <div >
        <FontAwesomeIcon className="Chat__Export" icon={faMarkdown} onClick={() => exportChatHistory('md')} />
      </div>
      {showPrompts && (
        <div className="SamplePrompts">
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

      <div className="Messages">
      {messages.map((msg, index) => (
          <div key={index} className={`MessageContainer ${msg.user}`}>
            {index === 0 || messages[index - 1].user !== msg.user ? (
              <div className="SenderName">{msg.user.toUpperCase()}</div>
            ) : null}
            <div 
              className={`Message ${msg.user} ${clickedMsgIndex === index ? "active" : ""}`} 
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
          <div className="FeedbackContainer">
            <div className="FeedbackTitle">Provide Feedback</div>
            <div className="FeedbackButtons">
              <FontAwesomeIcon 
                icon={faThumbsUp} 
                onClick={handleThumbsUp} 
                className={hasUpvoted ? 'UpvoteActive' : ''} 
              />
              <FontAwesomeIcon 
                icon={faThumbsDown} 
                onClick={handleThumbsDown} 
                className={hasDownvoted ? 'DownvoteActive' : ''} 
              />
            </div>
            <div className="DetailedFeedback">
              <a
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
      <div className="Chat__Container">
        {showDisclaimer && (
          <div className="DisclaimerRibbon">
            🧠 Hey there! Mind sharing your prompts to help make Evo even better?
            <div className="ButtonWrapper">
              <span className="CloseDisclaimer" onClick={handleCloseDisclaimer}>Accept</span>
              <span className="CloseWithoutTracking" onClick={handleCloseWithoutTracking}>Decline</span>
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
          className="Chat__Input"
          disabled={sending || showDisclaimer} // Disable input while sending or if disclaimer is shown
        />
        {evoRunning && (
          <>
            {
              !paused && (
                <button className="Chat__Btn" onClick={handlePause} disabled={!evoRunning || paused}>
                Pause
                </button>
              )
            }
            {
              paused && (
                <>
                  {!stopped && (
                     <button className="Chat__Btn" disabled={true}>
                     Pausing
                     </button>
                  )}

                  {stopped && (
                     <button className="Chat__Btn" onClick={handleContinue} disabled={evoRunning && !paused}>
                     Paused
                     </button>
                  )}
                </>
              )
            }
          </>
        )}

        {evoRunning ? (
          <div className="Spinner" />
        ) : (
          <button className="Chat__Btn" onClick={handleSend} disabled={evoRunning || sending}>
            Start
          </button>
        )}
      </div>
    </div>
  );
};

export default Chat;
