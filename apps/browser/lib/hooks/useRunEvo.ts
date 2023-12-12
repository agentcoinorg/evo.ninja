import { useEffect, useState } from "react";
import { Evo } from "@evo-ninja/agents";
import { ChatLog } from "@/components/Chat";

export const useRunEvo = (
  evo: Evo | undefined,
  onChatLog: (message: ChatLog) => Promise<void>
): {
  isRunning: boolean;
  onPause: () => void;
  start: (message: string) => void;
  onContinue: () => void;
  isPaused: boolean;
  isSending: boolean;
  isStopped: boolean;
  setIsSending: (sending: boolean) => void;
  setIterator: (iterator: ReturnType<Evo["run"]>) => void;
} => {
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const [iterator, setIterator] = useState<
    ReturnType<Evo["run"]> | undefined
  >();

  const start = (goal: string) => {
    console.log("Running...");
    setIsRunning(true);
  };

  const onPause = () => {
    if (!isPaused) {
      setIsPaused(true);
    }
  };

  const onContinue = () => {
    if (isPaused) {
      setIsPaused(false);
    }
  };

  useEffect(() => {
    const runEvo = async () => {
      // Create a new iteration thread
      if (!iterator) return;
      let stepCounter = 1;
      while (isRunning) {
        setIsStopped(false);
        const response = await iterator.next();
        if (response.done) {
          console.log(response.value);
          const actionTitle = response.value.value.title;
          if (
            actionTitle.includes("onGoalAchieved") ||
            actionTitle === "SUCCESS"
          ) {
            await onChatLog({
              title: "## Goal Achieved",
              user: "evo",
            });
          }
          setIsRunning(false);
          setIterator(undefined);
          setIsSending(false);
          evo?.reset();
          break;
        }

        await onChatLog({
          title: `## Step ${stepCounter}`,
          user: "evo",
        });

        if (!response.done) {
          // TODO: Update this function to add information to the modal output (rather than adding it into the chat)
          const evoMessage = {
            title: `### Action executed:\n${response.value.title}`,
            content: response.value.content,
            user: "evo",
          };
          // messageLog = [...messageLog, evoMessage];
          await onChatLog(evoMessage);
        }

        stepCounter++;
      }
    };

    const timer = setTimeout(runEvo, 200);
    return () => clearTimeout(timer);
  }, [isRunning, iterator, isPaused]);

  return {
    isRunning,
    onPause,
    start,
    onContinue,
    isPaused,
    isSending,
    isStopped,
    setIsSending,
    setIterator,
  };
};
