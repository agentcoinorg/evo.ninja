import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Button from "./Button";
import LoadingCircle from "./LoadingCircle";
import { Pause, Stop } from "@phosphor-icons/react";

interface ChatInputButtonProps {
  evoRunning: boolean;
  sending: boolean;
  paused: boolean;
  stopped: boolean;
  message: string;
  handlePause: () => void;
  handleContinue: () => void;
  handleSend: () => void;
}

const ChatInputButton = ({
  evoRunning,
  sending,
  paused,
  message,
  handlePause,
  stopped,
  handleContinue,
  handleSend,
}: ChatInputButtonProps) => {
  return (
    <>
      {!evoRunning ? (
        <Button
          hierarchy="secondary"
          onClick={async () => await handleSend()}
          disabled={message.length === 0 || sending}
          className="!p-2"
          type="submit"
        >
          <ArrowRight weight="bold" />
        </Button>
      ) : (
        <LoadingCircle />
      )}
    </>
  );
};

export default ChatInputButton;
