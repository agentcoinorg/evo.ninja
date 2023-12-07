import clsx from "clsx";
import Button from "./Button";
import Logo from "./Logo";

interface DisclaimerProps {
  handleDisclaimerSelect: (accept: boolean) => void;
  className?: string;
}

const Disclaimer = ({ handleDisclaimerSelect, className }: DisclaimerProps) => {
  return (
    <div
      className={clsx(
        "animate-slide-up fixed bottom-28 z-50 flex w-full max-w-[40rem] items-center justify-between space-x-2 self-center rounded-xl border-2 border-cyan-500/70 bg-gradient-to-b from-cyan-500/50 to-cyan-700/50 px-4 py-2.5 text-sm text-white opacity-0 shadow-xl backdrop-blur-[4px]",
        className
      )}
    >
      <div className="flex items-center space-x-2">
        <Logo wordmark={false} className="h-10 min-w-[2.5rem]" />
        <div>Mind sharing your prompts to help make Evo even better?</div>
      </div>
      <div className="flex gap-2.5">
        <Button
          className="!text-cyan-400 hover:!text-cyan-500/50"
          variant="text"
          onClick={() => handleDisclaimerSelect(true)}
        >
          Accept
        </Button>
        <Button
          className="!text-white hover:!text-white/50"
          variant="text"
          onClick={() => handleDisclaimerSelect(false)}
        >
          Decline
        </Button>
        {/* <span
          className="cursor-pointer px-5 py-2.5 font-bold text-cyan-400"
          onClick={() => handleDisclaimerSelect(true)}
        >
          Accept
        </span> */}
        {/* <span
          className="cursor-pointer px-5 py-2.5 font-bold text-white"
          onClick={() => handleDisclaimerSelect(false)}
        >
          Decline
        </span> */}
      </div>
    </div>
  );
};

export default Disclaimer;
