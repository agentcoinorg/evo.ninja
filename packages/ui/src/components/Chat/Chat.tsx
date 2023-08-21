import React, { useState, ChangeEvent, KeyboardEvent } from "react";
import "./Chat.css";

type Message = {
  text: string;
  user: string;
};

const Chat: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  const gibberishResponse = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleSend = () => {
    const newMessages = [...messages, { text: message, user: 'user' }];
    setMessages(newMessages);
    setMessage("");

    // Simulating a delay for the Evo response
    setTimeout(() => {
      setMessages([...newMessages, { text: gibberishResponse(), user: 'evo' }]);
    }, 1000);
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