import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { Evo } from "@evo-ninja/core";

import "./Chat.css";

type Message = {
  text: string;
  user: string;
};

export interface ChatProps {
  evo: Evo;
  onMessage: (message: string) => void;
}

const Chat: React.FC<ChatProps> = ({ evo, onMessage }: ChatProps) => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [evoRunning, setEvoRunning] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [evoItr, setEvoItr] = useState<ReturnType<Evo["run"]> | undefined>(
    undefined
  );

  useEffect(() => {
    const runEvo = async () => {
      if (!evoRunning) {
        return Promise.resolve();
      }

      // Create a new iteration thread
      if (!evoItr) {
        setEvoItr(evo.run(message));
        return Promise.resolve();
      }

      let messageLog = messages;

      while (evoRunning) {
        if (paused) {
          return Promise.resolve();
        }

        console.log("evoooo", paused);
        const response = await evoItr.next();

        // TODO:
        // - handle proptType === "Prompt"
        console.log(response);

        if (response.value && response.value.message) {
          messageLog = [...messageLog, {
            text: response.value.message,
            user: "evo"
          }];
          setMessages(messageLog);
          onMessage(response.value.message);
        }

        if (response.done) {
          setEvoRunning(false);
          return Promise.resolve();
        }
      }
      return Promise.resolve();
    }

    runEvo();
  }, [evoRunning, evoItr]);

  const handleSend = async () => {
    setMessages(messages => [...messages, {
      type: "info",
      text: message,
      user: 'user'
    }]);
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
    if (event.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="Chat">
      <div className="Messages">
        {messages.map((msg, index) => (
          <div key={index} className={`MessageContainer ${msg.user}`}>
            <div className="SenderName">{msg.user.toUpperCase()}</div>
            <div className={`Message ${msg.user}`}>{msg.text}</div>
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
                <button className="Chat__Btn" onClick={handleContinue} disabled={evoRunning && !paused}>
                Continue
                </button>
              )
            }
          </>
        )}

        {!evoRunning && (
          <button className="Chat__Btn" onClick={handleSend} disabled={evoRunning}>
            Start
          </button>
        )}
      </div>
    </div>
  );
};

export default Chat;