import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Button from "./Button";
import LoadingCircle from "./LoadingCircle";

interface ChatInputButtonProps {
  running: boolean;
  message: string;
  handleSend: () => void;
}

const ChatInputButton = ({
  running,
  message,
  handleSend,
}: ChatInputButtonProps) => {
  return (
    <>
      {!running ? (
        <Button
          hierarchy="secondary"
          onClick={async () => await handleSend()}
          disabled={message.length === 0}
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
