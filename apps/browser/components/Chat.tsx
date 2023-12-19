import {
  showDisclaimerAtom,
  errorAtom,
  localOpenAiApiKeyAtom,
  chatIdAtom,
  welcomeModalAtom,
  signInModalAtom,
  settingsModalAtom,
} from "@/lib/store";
import { useEvoService } from "@/lib/hooks/useEvoService";
import { UploadSimple } from "@phosphor-icons/react";
import ExamplePrompts from "@/components/ExamplePrompts";
import ChatLogs from "@/components/ChatLogs";
import Disclaimer from "@/components/modals/Disclaimer";
import React, { useState, ChangeEvent, memo } from "react";
import { useAtom } from "jotai";
import clsx from "clsx";
import Logo from "./Logo";
import Button from "./Button";
import ChatInputButton from "./ChatInputButton";
import TextField from "./TextField";
import { useUploadFiles } from "@/lib/hooks/useUploadFile";

export interface ChatLog {
  title: string;
  content?: string;
  user: string;
  color?: string;
}

export interface ChatProps {
  isAuthenticated: boolean;
  onCreateChat: (chatId: string) => void;
}

const Chat: React.FC<ChatProps> = ({
  isAuthenticated,
  onCreateChat,
}: ChatProps) => {
  const [chatId] = useAtom(chatIdAtom);
  const { getInputProps, open } = useUploadFiles();
  const [showDisclaimer, setShowDisclaimer] = useAtom(showDisclaimerAtom);
  const [, setError] = useAtom(errorAtom);
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [welcomeModalOpen, setWelcomeModalOpen] = useAtom(welcomeModalAtom);
  const [signInModalOpen] = useAtom(signInModalAtom);
  const [settingsModalOpen] = useAtom(settingsModalAtom)

  const [message, setMessage] = useState<string>("");
  const [goalSent, setGoalSent] = useState<boolean>(false);
  const { logs, isStarting, isRunning, handleStart } = useEvoService(
    chatId,
    isAuthenticated,
    onCreateChat
  );
  const shouldShowExamplePrompts = !logs || logs.length === 0;

  const handleGoalSubmit = (goal: string) => {
    if (!goal) {
      setError("Please enter a goal.");
      return;
    }

    if (isStarting || isRunning) {
      setError("Goal is already in progress.");
      return;
    }

    const firstTimeUser = !localOpenAiApiKey && !isAuthenticated;
    if (firstTimeUser) {
      setWelcomeModalOpen(true);
      return;
    }

    handleStart(goal);
    setMessage("");
    setGoalSent(true);
  };

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyPress = async (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !isStarting && !isRunning) {
      await handleGoalSubmit(message);
    }
  };

  return (
    <main
      className={clsx("relative flex h-full w-full flex-col", {
        "items-center justify-center": shouldShowExamplePrompts,
      })}
    >
      {shouldShowExamplePrompts && !goalSent ? (
        <Logo wordmark={false} className="mb-16 w-16" />
      ) : (
        <ChatLogs isRunning={isStarting || isRunning} logs={logs ?? []} />
      )}

      <div
        className={clsx(
          "mt-4 flex w-full space-y-4",
          shouldShowExamplePrompts
            ? "flex-col-reverse space-y-reverse px-4 md:px-8 lg:px-4"
            : "mx-auto max-w-[56rem] flex-col px-4"
        )}
      >
        {shouldShowExamplePrompts && !goalSent && (
          <ExamplePrompts
            onClick={async (prompt: string) => await handleGoalSubmit(prompt)}
          />
        )}
        <div
          className={clsx(
            "mb-4 flex w-full items-center justify-center gap-4 self-center",
            shouldShowExamplePrompts ? "max-w-[42rem] " : "max-w-[56rem]"
          )}
        >
          <TextField
            type="text"
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyPress}
            placeholder="Ask Evo anything..."
            className="!rounded-lg !p-4 !pl-12"
            leftAdornment={
              <>
                <Button variant="icon" className="!text-white" onClick={open}>
                  <UploadSimple size={20} />
                </Button>
                <input {...getInputProps()} />
              </>
            }
            rightAdornment={
              <ChatInputButton
                running={isRunning}
                message={message}
                handleSend={async () => await handleGoalSubmit(message)}
              />
            }
            rightAdornmentClassnames="!right-3"
            disabled={isRunning || showDisclaimer} // Disable input while sending or if disclaimer is shown
          />
        </div>
      </div>
      <Disclaimer
        isOpen={showDisclaimer && !welcomeModalOpen && !signInModalOpen && !settingsModalOpen}
        onClose={() => setShowDisclaimer(false)}
      />
    </main>
  );
};

export default memo(Chat);
