import React, { useState, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { Evo } from "@evo-ninja/core";

import "./Chat.css";

type Message = {
  text: string;
  user: string;
};

export interface ChatProps {
  evo: Evo;
}

const Chat: React.FC<ChatProps> = (props: ChatProps) => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [evoRunning, setEvoRunning] = useState<boolean>(false);
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
        const { evo } = props;
        setEvoItr(evo.run(message));
        return Promise.resolve();
      }

      let messageLog = messages;

      while (evoRunning) {
        const response = await evoItr.next();

        if (response.value && response.value.message) {
          messageLog = [...messageLog, {
            text: response.value.message,
            user: "evo"
          }];
          setMessages(messageLog);
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
    const newMessages = [...messages, { text: message, user: 'user' }];
    setMessages(newMessages);
    setMessage("");
    setEvoRunning(true);
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
        <button className="Chat__Btn" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;