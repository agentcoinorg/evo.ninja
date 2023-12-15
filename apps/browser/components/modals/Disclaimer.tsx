import Button from "../Button";
import Logo from "../Logo";

interface DisclaimerProps {
  handleDisclaimerSelect: (accept: boolean) => void;
}

const Disclaimer = ({ handleDisclaimerSelect }: DisclaimerProps) => {
  return (
    <div className={"fixed bottom-4 z-50 w-full px-2 md:bottom-28"}>
      <div
        className={
          "flex w-full max-w-[40rem] max-w-[40rem] animate-slide-up items-center items-center justify-between justify-between space-x-2 space-x-2 self-center rounded-xl rounded-xl border-2 border-2 border-cyan-500/70 border-cyan-500/70 bg-gradient-to-b bg-gradient-to-b from-cyan-500/50 from-cyan-500/50 to-cyan-700/50 to-cyan-700/50 px-2 py-2.5 text-xs text-white opacity-0 shadow-xl backdrop-blur-[4px] md:px-4 md:text-sm"
        }
      >
        <div className="flex items-center space-x-1.5 md:space-x-2">
          <Logo
            wordmark={false}
            className="h-8 min-w-[2rem] md:h-10 md:min-w-[2.5rem]"
          />
          <div>Mind sharing your prompts to help make Evo even better?</div>
        </div>
        <div className="flex gap-2.5">
          <Button
            className="text-xs !text-cyan-400 hover:!text-cyan-500/50"
            variant="text"
            onClick={() => handleDisclaimerSelect(true)}
          >
            Accept
          </Button>
          <Button
            className="text-xs !text-white hover:!text-white/50"
            variant="text"
            onClick={() => handleDisclaimerSelect(false)}
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
