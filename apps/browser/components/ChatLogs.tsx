import { ChatLog } from "@/components/Chat";
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import clsx from "clsx";

export interface ChatLogsProps {
  logs: ChatLog[];
}

export default function ChatLogs(props: ChatLogsProps) {
  const { logs } = props;
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = () => {
    listContainerRef.current?.scrollTo({
      top: listContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }

  const handleScroll = useCallback(() => {
    // Detect if the user is at the bottom of the list
    const container = listContainerRef.current;
    if (container) {
      const isScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight;
      setIsAtBottom(isScrolledToBottom);
    }
  }, []);

  useEffect(() => {
    // If the user is at the bottom, scroll to the new item
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [logs, isAtBottom]);

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

  if (isAtBottom) {
    scrollToBottom();
  }

  return (
    <div
      ref={listContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-auto p-5 text-left items-center"
    >
      {logs.map((msg, index, logs) => (
        <div key={index} className={`${msg.user} m-auto self-center w-[100%] max-w-[56rem]`}>
          {index === 0 || logs[index - 1].user !== msg.user ? (
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
  );
}
