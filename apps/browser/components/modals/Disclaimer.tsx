import clsx from "clsx";
import Button from "../Button";
import Logo from "../Logo";
import { allowTelemetryAtom, sidebarAtom } from "@/lib/store";
import { useAtom } from "jotai";

interface DisclaimerProps {
  onClose: () => void;
  isOpen: boolean;
}

const Disclaimer = ({ onClose, isOpen }: DisclaimerProps) => {
  const [, setAllowTelemetry] = useAtom(allowTelemetryAtom);

  const handleDisclaimerSelect = (accept: boolean) => {
    setAllowTelemetry(accept);
    onClose();
  };

  const [sidebarOpen] = useAtom(sidebarAtom);
  return isOpen ? (
    <div
      className={clsx(
        "fixed bottom-4 z-50 flex w-full items-center justify-center px-2 md:bottom-28 md:w-[42rem] md:-translate-x-1/2 md:transform md:transition-[left] md:duration-300 md:ease-in-out",
        sidebarOpen
          ? "max-w-[calc(100vw-306px)] md:left-[calc(50%+145px)] "
          : "md:left-1/2"
      )}
    >
      <div
        className={
          "mx-auto flex w-full animate-slide-up items-center space-x-2 self-center rounded-xl rounded-xl border-2 border-cyan-500/70 bg-gradient-to-b from-cyan-500/50 from-cyan-500/50 to-cyan-700/50 px-2 py-2.5 text-xs text-white opacity-0 shadow-xl backdrop-blur-[4px] md:px-4 md:text-sm"
        }
      >
        <div className="flex w-full items-center space-x-1.5 md:space-x-2">
          <Logo
            wordmark={false}
            className="h-8 min-w-[2rem] md:h-10 md:min-w-[2.5rem]"
          />
          <div className="w-full">
            Mind sharing your prompts to help make Evo even better?
          </div>
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
  ) : null;
};

export default Disclaimer;
