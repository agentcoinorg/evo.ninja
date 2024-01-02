import {
  showDisclaimerAtom,
  errorAtom,
  chatInfoAtom,
  welcomeModalAtom,
  signInModalAtom,
  settingsModalAtom,
} from "@/lib/store";
import { useWorkspaceUploadDrop } from "@/lib/hooks/useWorkspaceUploadDrop";
import { useFirstTimeUser } from "@/lib/hooks/useFirstTimeUser";
import ExamplePrompts from "@/components/ExamplePrompts";
import ChatLogs from "@/components/ChatLogs";
import Disclaimer from "@/components/modals/Disclaimer";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import ChatInputButton from "@/components/ChatInputButton";
import React, { useState, ChangeEvent } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { useAtom } from "jotai";
import clsx from "clsx";
import { InMemoryFile } from "@nerfzael/memory-fs";
import TextAreaField from "./inputs/TextAreaField";

export interface ChatLog {
  title: string;
  content?: string;
  user: string;
  color?: string;
  created_at?: string;
}

export interface ChatProps {
  logs: ChatLog[];
  isStarting: boolean;
  isRunning: boolean;
  onGoalSubmit: (goal: string) => Promise<void>;
  onUpload: (upload: InMemoryFile[]) => void;
  status: string | undefined;
}

const Chat: React.FC<ChatProps> = ({
  logs,
  isStarting,
  isRunning,
  onGoalSubmit,
  onUpload,
  status,
}: ChatProps) => {
  const [{ id: chatId, name: chatName }] = useAtom(chatInfoAtom);
  const [showDisclaimer, setShowDisclaimer] = useAtom(showDisclaimerAtom);
  const [, setError] = useAtom(errorAtom);
  const [welcomeModalOpen, setWelcomeModalOpen] = useAtom(welcomeModalAtom);
  const [signInModalOpen] = useAtom(signInModalAtom);
  const [settingsModalOpen] = useAtom(settingsModalAtom);

  const [message, setMessage] = useState<string>("");

  const { getInputProps, open } = useWorkspaceUploadDrop(onUpload);
  const firstTimeUser = useFirstTimeUser();

  const shouldShowExamplePrompts =
    !chatId || (!logs.length && !isStarting && !isRunning);

  const handleGoalSubmit = async (goal: string): Promise<void> => {
    if (firstTimeUser) {
      setWelcomeModalOpen(true);
      return;
    }
    if (!goal) {
      setError("Please enter a goal.");
      return;
    }
    setMessage("");
    return onGoalSubmit(goal);
  };

  const onUploadOpen = () => {
    if (firstTimeUser) {
      setWelcomeModalOpen(true);
      return;
    }
    open();
  };

  return (
    <main
      className={clsx("relative flex h-full w-full flex-col", {
        "items-center justify-center": shouldShowExamplePrompts,
      })}
    >
      {shouldShowExamplePrompts ? (
        <Logo wordmark={false} className="mb-16 w-16" />
      ) : (
        <ChatLogs
          status={status}
          chatName={chatName ?? "New Session"}
          isRunning={isStarting || isRunning}
          logs={logs}
        />
      )}

      <div
        className={clsx(
          "mt-4 flex w-full space-y-4",
          shouldShowExamplePrompts
            ? "flex-col-reverse space-y-reverse px-4 md:px-8 lg:px-4"
            : "mx-auto max-w-[56rem] flex-col px-4"
        )}
      >
        {shouldShowExamplePrompts && (
          <ExamplePrompts onClick={handleGoalSubmit} />
        )}
        <div
          className={clsx(
            "mb-4 flex w-full items-center justify-center gap-4 self-center",
            shouldShowExamplePrompts ? "max-w-[42rem] " : "max-w-[56rem]"
          )}
        >
          <TextAreaField
            rows={1}
            value={message}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
              setMessage(event.target.value);
            }}
            onKeyDown={(event: React.KeyboardEvent) => {
              if (!event.shiftKey && event.key === "Enter") {
                event.preventDefault();
                if (!isStarting && !isRunning) {
                  return handleGoalSubmit(message);
                }
              }
            }}
            placeholder="Ask Evo anything..."
            className="max-h-[200px] resize-none !rounded-lg !p-4 !pl-12"
            leftAdornment={
              <>
                <Button
                  variant="icon"
                  className="!text-white"
                  onClick={onUploadOpen}
                >
                  <UploadSimple size={20} />
                </Button>
                <input {...getInputProps()} />
              </>
            }
            rightAdornment={
              <ChatInputButton
                running={isRunning}
                message={message}
                handleSend={() => handleGoalSubmit(message)}
              />
            }
            rightAdornmentClassnames="!right-3"
            disabled={isRunning || showDisclaimer} // Disable input while sending or if disclaimer is shown
          />
        </div>
      </div>
      <Disclaimer
        isOpen={
          showDisclaimer &&
          !welcomeModalOpen &&
          !signInModalOpen &&
          !settingsModalOpen
        }
        onClose={() => setShowDisclaimer(false)}
      />
    </main>
  );
};

export default Chat;
