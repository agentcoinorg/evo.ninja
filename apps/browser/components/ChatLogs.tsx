import { ChatLog } from "@/components/Chat";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import ReactMarkdown from "react-markdown";
import LoadingCircle from "./LoadingCircle";
import { ArrowSquareRight } from "@phosphor-icons/react";
import Logo from "./Logo";
import { useSession } from "next-auth/react";
import ChatDetails from "./modals/ChatDetails";

export interface ChatLogsProps {
  logs: ChatLog[];
  isRunning: boolean;
  currentStatus: string | undefined;
  chatName: string
}

export type MessageSet = {
  userMessage: string;
  evoMessage?: string;
  details: Record<string, string[]>;
};

export function sanitizeLogs(messages: ChatLog[]): MessageSet[] {
  console.log(messages)
  if (!messages || !messages.length) return [];
  const dividedMessages: MessageSet[] = [];
  let currentMessageSet: MessageSet = { userMessage: "", details: {} };
  let currentStepTitle = "";
  let evoMessageFlag = false;

  messages.sort((a, b) => {
    return new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime()
  })
  // const s = [...messages].reduce((sanitizedLogs, currentMessage, index) => {
  //   return [];
  // }, []);

  messages.forEach((message, index) => {
    if (!message.title.startsWith("#")) {
      if (
        currentMessageSet.userMessage &&
        !evoMessageFlag &&
        message.user === "evo"
      ) {
        // This is the evoMessage after details
        currentMessageSet.evoMessage = message.title;
        evoMessageFlag = true;
      } else if (!currentMessageSet.userMessage && message.user === "user") {
        // This is the initial userMessage
        currentMessageSet.userMessage = message.title;
        evoMessageFlag = false;
      } else {
        // New set starts here
        dividedMessages.push(currentMessageSet);
        currentMessageSet = { userMessage: message.title, details: {} };
        currentStepTitle = "";
        evoMessageFlag = false;
      }
    } else {
      if (message.title.startsWith("## ")) {
        // New step title
        currentStepTitle = message.title;
        currentMessageSet.details[currentStepTitle] = [];
      } else if (currentStepTitle) {
        // Add detail to the current step
        const detailContent = message.content ? message.title.concat(`\n${message.content}`) : message.title
        currentMessageSet.details[currentStepTitle].push(detailContent);
      }
    }

    // Handle the last element
    if (index === messages.length - 1) {
      dividedMessages.push(currentMessageSet);
    }
  });

  return dividedMessages;
}

export default function ChatLogs({
  logs,
  isRunning,
  currentStatus,
  chatName
}: ChatLogsProps) {
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const { data: session } = useSession();
  const scrollToBottom = () => {
    listContainerRef.current?.scrollTo({
      top: listContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const sanitizedLogs = useMemo(() => {
    return sanitizeLogs(logs);
  }, [logs]);

  const [logsDetails, setLogsDetails] = useState<{
    open: boolean;
    index: number;
  }>({ open: false, index: 0 });

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

  return (
    <>
      <div className="flex h-20 items-center justify-center border-b-2 border-zinc-800 md:h-12">
        <div>{chatName}</div>
      </div>
      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        className="w-full flex-1 items-center space-y-6 overflow-y-auto overflow-x-clip px-2 py-3 text-left [scrollbar-gutter:stable]"
      >
        {sanitizedLogs.map((msg, index) => {
          return (
            <div
              key={index}
              className={"m-auto w-full max-w-[56rem] self-center"}
            >
              <div className="group relative flex w-full animate-slide-down items-start space-x-3 rounded-lg p-2 pb-10 text-white opacity-0 transition-colors duration-300 ">
                <>
                  {session?.user.image && session?.user.email ? (
                    <img
                      src={session?.user.image}
                      className="h-8 w-8 rounded-full bg-yellow-500"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-yellow-500" />
                  )}
                </>
                <div className="w-full max-w-[calc(100vw-84px)] space-y-2 pt-1 md:max-w-[49rem]">
                  <>
                    <div className="flex items-center justify-between">
                      <span className="SenderName font-medium">
                        {session?.user.name ? session?.user.name : "User"}
                      </span>
                    </div>
                  </>
                  <div className="prose prose-invert w-full max-w-none">
                    {msg.userMessage}
                  </div>
                </div>
              </div>
              <div
                key={index}
                className={"m-auto w-full max-w-[56rem] self-center"}
              >
                <div className="group relative flex w-full animate-slide-down items-start space-x-3 rounded-lg p-2 pb-10 text-white opacity-0 transition-colors duration-300 ">
                  <Logo wordmark={false} className="!w-8 !min-w-[2rem]" />
                  <div className="w-full max-w-[calc(100vw-84px)] space-y-2 pt-1 md:max-w-[49rem]">
                    <>
                      <div className="flex items-center justify-between">
                        <span className="SenderName font-medium">Evo</span>
                        {msg.evoMessage && !isRunning && (
                          <button
                            className="group/button flex items-center space-x-2 text-cyan-500 hover:text-cyan-400"
                            onClick={() =>
                              setLogsDetails({
                                open: true,
                                index,
                              })
                            }
                          >
                            <div className="font-regular text-xs group-hover/button:underline">
                              View Details
                            </div>
                            <ArrowSquareRight size={24} />
                          </button>
                        )}
                      </div>
                    </>
                    {msg.evoMessage && (
                      <ReactMarkdown className="prose prose-invert w-full max-w-none">
                        {msg.evoMessage}
                      </ReactMarkdown>
                    )}
                    {!msg.evoMessage &&
                      isRunning &&
                      sanitizedLogs.length - 1 === index && (
                        <>
                          <div className="flex items-center space-x-2 text-cyan-500">
                            <LoadingCircle />
                            <div className="group/loading flex cursor-pointer items-center space-x-2 text-cyan-500 transition-all duration-500 hover:text-cyan-700">
                              <div
                                className="group-hover/loading:underline"
                                onClick={() =>
                                  setLogsDetails({
                                    open: true,
                                    index,
                                  })
                                }
                              >
                                {currentStatus}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {!msg.evoMessage && !isRunning && (
                        <ReactMarkdown className="prose prose-invert w-full max-w-none">
                          There was an issue with your request, please try again
                        </ReactMarkdown>
                      )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ChatDetails
        isOpen={logsDetails.open}
        onClose={() => setLogsDetails({ ...logsDetails, open: false })}
        logs={sanitizedLogs[logsDetails.index]}
      />
    </>
  );
}
