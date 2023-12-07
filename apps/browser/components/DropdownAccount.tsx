import { GearSix, UserCirclePlus } from "@phosphor-icons/react";
import clsx from "clsx";
import React, { forwardRef, useState } from "react";
import SettingsModal from "./SettingsModal";
import { useAtom } from "jotai";
import { allowTelemetryAtom, localOpenAiApiKeyAtom } from "@/lib/store";
import { useSession } from "next-auth/react";

interface DropdownAccountProps {
  dropdownOpen: boolean;
}

const DropdownAccount: React.ForwardRefRenderFunction<
  HTMLDivElement,
  DropdownAccountProps
> = ({ dropdownOpen }, ref) => {
  const [allowTelemetry] = useAtom(allowTelemetryAtom);
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const firstTimeUser = !localOpenAiApiKey && !session?.user;

  const handleAccountSettingsClick = () => {
    setIsOpen(true);
  };

  const onClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div
        ref={ref}
        className={clsx(
          "animate-fade-in absolute bottom-full left-2 w-[272px] space-y-1 rounded-lg border-2 border-zinc-700 bg-zinc-800 p-2 shadow-lg",
          { hidden: !dropdownOpen }
        )}
      >
        <div
          className="flex w-full cursor-pointer items-center space-x-2 rounded-md p-2 text-zinc-100 transition-colors duration-300 hover:bg-zinc-700 hover:text-white"
          onClick={handleAccountSettingsClick}
        >
          <GearSix size={16} weight="bold" />
          <div className="leading-none">Account Settings</div>
        </div>
        <div className="flex w-full cursor-pointer items-center space-x-2 rounded-md p-2 text-zinc-100 transition-colors duration-300 hover:bg-zinc-700 hover:text-white">
          <UserCirclePlus size={16} weight="bold" />
          <div className="leading-none">Sign In</div>
        </div>
      </div>
      <SettingsModal
        isOpen={isOpen}
        onClose={onClose}
        apiKey={localOpenAiApiKey}
        allowTelemetry={allowTelemetry}
        firstTimeUser={firstTimeUser}
      />
    </>
  );
};

export default forwardRef(DropdownAccount);
