import React, { useState, useEffect, ChangeEvent, KeyboardEvent, useRef } from "react";
import { Evo } from "@evo-ninja/core";
import ReactMarkdown from "react-markdown";

import { trackMessageSent } from '../googleAnalytics';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMarkdown } from '@fortawesome/free-brands-svg-icons';

import "./Chat.css";

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
  goalEnded: boolean
}

const Chat: React.FC<ChatProps> = ({ evo, onMessage, messages, goalEnded }: ChatProps) => {
  const [message, setMessage] = useState<string>("");
  const [evoRunning, setEvoRunning] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [evoItr, setEvoItr] = useState<ReturnType<Evo["run"]> | undefined>(
    undefined
  );
  const [stopped, setStopped] = useState<boolean>(false);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(true);
  const [trackUser, setTrackUser] = useState<boolean>(false);
  const [hoveredMsgIndex, setHoveredMsgIndex] = useState<number>(-1);

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


  const handleCloseDisclaimer = () => {
    setShowDisclaimer(false);
    setTrackUser(true);  // User accepted disclaimer, enable tracking
  };

  const handleCloseWithoutTracking = () => {
    setShowDisclaimer(false);
    setTrackUser(false); // User did not accept disclaimer, disable tracking
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
      <div className="Messages">
        {messages.map((msg, index) => (
          <div key={index} className={`MessageContainer ${msg.user}`}>
            <div className="SenderName">{msg.user.toUpperCase()}</div>
            <div 
              className={`Message ${msg.user}`} 
              style={msg.color ? { borderColor: msg.color, cursor: 'pointer' } : { cursor: 'pointer'}} 
              onMouseEnter={() => setHoveredMsgIndex(index)} 
              onMouseLeave={() => setHoveredMsgIndex(-1)}
            >
              <div>
                {
                  hoveredMsgIndex === index 
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
