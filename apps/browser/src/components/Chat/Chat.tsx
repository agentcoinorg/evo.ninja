import React, { useState, useEffect, ChangeEvent, KeyboardEvent, useRef } from "react";
import { Evo } from "@evo-ninja/core";
import ReactMarkdown from "react-markdown";

import { trackMessageSent } from '../googleAnalytics';

import "./Chat.css";

export interface ChatMessage {
  text: string;
  user: string;
  color?: string;
}

export interface ChatProps {
  evo: Evo;
  onMessage: (message: ChatMessage) => void;
  messages: ChatMessage[];
  goalAchieved: boolean
}

interface Window {
  gtag: any;
}
declare var window: Window;


const Chat: React.FC<ChatProps> = ({ evo, onMessage, messages, goalAchieved }: ChatProps) => {
  const [message, setMessage] = useState<string>("");
  const [evoRunning, setEvoRunning] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [evoItr, setEvoItr] = useState<ReturnType<Evo["run"]> | undefined>(
    undefined
  );
  const [stopped, setStopped] = useState<boolean>(false);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(true);


  const pausedRef = useRef(paused);
  useEffect(() => {
      pausedRef.current = paused;
  }, [paused]);

  const goalAchievedRef = useRef(paused);
  useEffect(() => {
    goalAchievedRef.current = goalAchieved;
  }, [goalAchieved]);

  useEffect(() => {
    if (goalAchieved) {
      setPaused(true);
    }
  }, [goalAchieved]);

  useEffect(() => {
    const runEvo = async () => {
      if (!evoRunning) {
        return Promise.resolve();
      }

      // Create a new iteration thread
      if (!evoItr) {
        const goal = messages.filter((msg) => msg.user === "user")[0].text;
        setEvoItr(evo.run(goal));
        return Promise.resolve();
      }

      let messageLog = messages;

      while (evoRunning) {
        if (pausedRef.current || goalAchievedRef.current) {
          setStopped(true);
          return Promise.resolve();
        }

        setStopped(false);

        const response = await evoItr.next();

        if (response.value && response.value.message) {
          const evoMessage = {
            text: response.value.message,
            user: "evo"
          };
          messageLog = [...messageLog, evoMessage];
          if (!goalAchievedRef.current) {
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
  };

  const handleSend = async () => {
    onMessage({
      text: message,
      user: "user"
    });
    setSending(true);
    setMessage("");
    setEvoRunning(true);
    trackMessageSent(message); // Google Analytics Event tracker
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

  return (
    <div className="Chat">
      {showDisclaimer && (
        <div className="DisclaimerRibbon">
          🧠 Disclaimer: In order to improve Evo, all inputs to the agent through this UI will be tracked so don't share any sensitive information or private keys.
          <span className="CloseDisclaimer" onClick={handleCloseDisclaimer}>Agree and Continue</span>
        </div>
      )}
      <div className="Messages">
        {messages.map((msg, index) => (
          <div key={index} className={`MessageContainer ${msg.user}`}>
            <div className="SenderName">{msg.user.toUpperCase()}</div>
            <div className={`Message ${msg.user}`} style={msg.color ? { borderColor: msg.color } : undefined}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <div className="Chat__Container">
        <input
          type="text"
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter your main goal here..."
          className="Chat__Input"
          disabled={sending} // Disable input while sending
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
