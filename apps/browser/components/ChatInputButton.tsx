import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Button from "./Button";
import LoadingCircle from "./LoadingCircle";
import { Pause, Stop } from "@phosphor-icons/react";

interface ChatInputButtonProps {
  evoRunning: boolean;
  sending: boolean;
  paused: boolean;
  stopped: boolean;
  handlePause: () => void;
  handleContinue: () => void;
  handleSend: () => void;
}

const ChatInputButton = ({
  evoRunning,
  sending,
  paused,
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
              className="!px-2 !py-1"
            >
              <Pause weight="fill" />
              <div>Pause</div>
            </Button>
          )}
          {paused && (
            <>
              {!stopped && (
                <Button
                  hierarchy="secondary"
                  disabled={true}
                  className="!px-2 !py-1"
                >
                  <LoadingCircle />
                  <div>Pausing</div>
                </Button>
              )}

              {stopped && (
                <Button
                  hierarchy="secondary"
                  onClick={handleContinue}
                  disabled={evoRunning && !paused}
                  className="!px-2 !py-1"
                >
                  <Stop weight="fill" />
                  <div>Paused</div>
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
          disabled={evoRunning || sending}
          className="!p-2"
        >
          <ArrowRight weight="bold" />
        </Button>
      )}
    </>
  );
};

export default ChatInputButton;
