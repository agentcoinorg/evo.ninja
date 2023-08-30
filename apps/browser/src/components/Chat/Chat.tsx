import React, { useState, useEffect, ChangeEvent, KeyboardEvent, useRef } from "react";
import { Evo } from "@evo-ninja/core";
import ReactMarkdown from "react-markdown";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMarkdown, } from '@fortawesome/free-brands-svg-icons';
import { faStopCircle, faMicrophone } from '@fortawesome/free-solid-svg-icons';  // Updated import
import { initializeMediaRecorder, startRecording, stopRecording, setOnDataAvailable, transcribeAudio, handleAudioTranscription } from '../MediaRecorder';


import "./Chat.css";

let mediaRecorder: MediaRecorder;

export interface ChatMessage {
  text: string;
  user: string;
  color?: string;
}

export interface ChatProps {
  evo: Evo;
  onMessage: (message: ChatMessage) => void;
  messages: ChatMessage[];
  goalAchieved: boolean;
  apiKey: string | null;
}

const Chat: React.FC<ChatProps> = ({ evo, onMessage, messages, goalAchieved, apiKey }: ChatProps) => {
  const [message, setMessage] = useState<string>("");
  const [evoRunning, setEvoRunning] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [evoItr, setEvoItr] = useState<ReturnType<Evo["run"]> | undefined>(
    undefined
  );
  const [stopped, setStopped] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false); // New state variable to track recording status

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

  useEffect(() => {
    initializeMediaRecorder()
      .then(() => {
        setOnDataAvailable((dataBlob) => {
          setAudioBlob(dataBlob);
        });
      })
      .catch((error) => {
        console.error("Failed to initialize media recorder:", error);
      });
  }, []);


  useEffect(() => {
    if (audioBlob) {
      transcribeAudio(audioBlob, apiKey!).then((transcript: string) => {
        console.log("Transcript:", transcript);
        if (transcript) {
          onMessage({
            text: transcript,
            user: "user"
          });
          handleSend();  // Automatically trigger the "Start" button's functionality
        }
      }).catch((error: Error) => {
        console.error('Transcription failed:', error);
      });
    }
  }, [audioBlob]);
  
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsRecording(!isRecording);
  };

  useEffect(() => {
    if (audioBlob) {
      handleAudioTranscription(audioBlob, apiKey)
        .then((transcript) => {
          if (transcript) {
            onMessage({
              text: transcript,
              user: "user",
            });
            handleSend(); // Automatically trigger the "Start" button's functionality
          }
        })
        .catch((error: Error) => {
          console.error("Transcription failed:", error);
        });
    }
  }, [audioBlob]);  

  const handleSend = async () => {
    onMessage({
      text: message,
      user: "user"
    });
    setSending(true);
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

  const exportChatHistory = (format: 'md') => {
    let exportedContent = '';
    if (format === 'md') {
      exportedContent = messages.map((msg) => {
        return `# ${msg.user.toUpperCase()}\n${msg.text}\n---\n`;
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

        <button className={`Chat__Btn ${isRecording ? "Chat__Btn--recording" : ""}`} onClick={toggleRecording}>
          {isRecording ? (
            <FontAwesomeIcon icon={faStopCircle} />
          ) : (
            <FontAwesomeIcon icon={faMicrophone} />
          )}
          {isRecording ? "" : ""}
        </button>
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
