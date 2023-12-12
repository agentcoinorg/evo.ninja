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
      {evoRunning && (
        <>
          {!paused && (
            <Button
              hierarchy="secondary"
              onClick={handlePause}
              disabled={!evoRunning || paused}
              className="!p-1 md:!px-2"
            >
              <Pause weight="fill" />
              <div className="hidden md:block">Pause</div>
            </Button>
          )}
          {paused && (
            <>
              {!stopped && (
                <Button
                  hierarchy="secondary"
                  disabled={true}
                  className="!p-1 md:!px-2"
                >
                  <LoadingCircle />
                  <div className="hidden md:block">Pausing</div>
                </Button>
              )}

              {stopped && (
                <Button
                  hierarchy="secondary"
                  onClick={handleContinue}
                  disabled={evoRunning && !paused}
                  className="!p-1 md:!px-2"
                >
                  <Stop weight="fill" />
                  <div className="hidden md:block">Paused</div>
                </Button>
              )}
            </>
          )}
        </>
      )}

      {!evoRunning && (
        <Button
          hierarchy="secondary"
          onClick={async () => await handleSend()}
          disabled={message.length === 0 || sending}
          className="!p-2"
          type="submit"
        >
          <ArrowRight weight="bold" />
        </Button>
      )}
    </>
  );
};

export default ChatInputButton;
