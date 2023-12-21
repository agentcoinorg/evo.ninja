import { ChatLog } from "@/components/Chat";
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import LoadingCircle from "./LoadingCircle";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { useSession } from "next-auth/react";

export interface ChatLogsProps {
  logs: ChatLog[];
  isRunning: boolean;
}

export default function ChatLogs(props: ChatLogsProps) {
  const { logs, isRunning } = props;
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const { data: session } = useSession();
  const scrollToBottom = () => {
    listContainerRef.current?.scrollTo({
      top: listContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleScroll = useCallback(() => {
    // Detect if the user is at the bottom of the list
    const container = listContainerRef.current;
    if (container) {
      const isScrolledToBottom =
        container.scrollHeight - container.scrollTop <= container.clientHeight;
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
      container.addEventListener("scroll", handleScroll);
    }

    // Clean up listener
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  if (isAtBottom) {
    scrollToBottom();
  }

  return (
    <>
      <div className="flex h-20 items-center justify-center border-b-2 border-zinc-800 md:h-12">
        {/* <div>{chatName}</div> */}
      </div>
      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        className="w-full flex-1 items-center space-y-6 overflow-y-auto overflow-x-clip px-2 py-3 text-left [scrollbar-gutter:stable]"
      >
        {logs.map((msg, index, logs) => {
          const isEvo = msg.user === "evo";
          const previousMessage = logs[index - 1];
          return (
            <div
              key={index}
              className="m-auto w-full max-w-[56rem] self-center"
            >
              <div className="group relative flex w-full animate-slide-down items-start space-x-3 rounded-lg p-2 text-white opacity-0 transition-colors duration-300 ">
                <div className="!h-8 !w-8 !min-w-[2rem]">
                  {isEvo && previousMessage?.user === "user" ? (
                    <Logo wordmark={false} className="w-full" chatAvatar />
                  ) : !isEvo ? (
                    <>
                      {session?.user.image && session?.user.email ? (
                        <img
                          src={session?.user.image}
                          className="h-full w-full rounded-full bg-cyan-600"
                        />
                      ) : !session?.user.email ? (
                        <Avatar size={32} />
                      ) : (
                        <div className="w-full rounded-full bg-cyan-600" />
                      )}
                    </>
                  ) : null}
                </div>
                <div className="max-w-[calc(100vw-84px)] space-y-2 pt-1 md:max-w-[49rem]">
                  {index === 0 || previousMessage?.user !== msg.user ? (
                    <div className="SenderName font-medium">
                      {session?.user.name && !msg.user.includes("evo")
                        ? session?.user.name
                        : msg.user.charAt(0).toUpperCase() + msg.user.slice(1)}
                    </div>
                  ) : null}
                  <div className="prose prose-invert w-full max-w-none">
                    <ReactMarkdown>{msg.title.toString()}</ReactMarkdown>
                    <ReactMarkdown>
                      {msg.content?.toString() ?? ""}
                    </ReactMarkdown>
                  </div>
                  {isEvo && isRunning && index === logs.length - 1 && (
                    <div className="flex items-center space-x-2 text-cyan-500">
                      <LoadingCircle />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
