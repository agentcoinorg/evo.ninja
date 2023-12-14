import {
  GearSix,
  Question,
  SignOut,
  UserCirclePlus,
} from "@phosphor-icons/react";
import clsx from "clsx";
import React, { forwardRef, useEffect, useState } from "react";
import SettingsModal from "./modals/SettingsModal";
import { useAtom } from "jotai";
import {
  allowTelemetryAtom,
  capReachedAtom,
  localOpenAiApiKeyAtom,
  signInModalAtom,
} from "@/lib/store";
import { useSession, signOut } from "next-auth/react";
import SignInModal from "./modals/SignInModal";

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
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useAtom(signInModalAtom);
  const firstTimeUser = !localOpenAiApiKey && !session?.user;
  const [capReached] = useAtom(capReachedAtom);

  const handleAccountSettingsClick = () => {
    setIsSettingsModalOpen(true);
  };

  const onSettingsClose = () => {
    setIsSettingsModalOpen(false);
  };

  const handleSignInClick = () => {
    setIsSignInModalOpen(true);
  };

  const onSignInClose = () => {
    setIsSignInModalOpen(false);
  };

  useEffect(() => {
    if (capReached) {
      setIsSettingsModalOpen(true);
    }
  }, [capReached]);

  const menuItemClasses =
    "flex w-full cursor-pointer items-center space-x-2 rounded-md p-2 text-zinc-100 transition-colors duration-300 hover:bg-zinc-700 hover:text-white active:bg-zinc-900 active:ring-2 active:ring-inset active:ring-cyan-500/20 active:text-cyan-500";

  return (
    <>
      <div
        ref={ref}
        className={clsx(
          "animate-fade-in absolute bottom-full left-2 w-[272px] rounded-lg border-2 border-zinc-700 bg-zinc-800 p-2 shadow-lg",
          { hidden: !dropdownOpen },
          { "md:space-y-1": session?.user.email }
        )}
      >
        {session?.user.email && (
          <div className={menuItemClasses} onClick={handleAccountSettingsClick}>
            <GearSix size={16} weight="bold" />
            <div className="leading-none">Account Settings</div>
          </div>
        )}
        <a
          className={menuItemClasses}
          href="https://discord.gg/r3rwh69cCa"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Question size={16} weight="bold" />
          <div className="leading-none">Support</div>
        </a>
        <div className="relative w-full py-2 before:absolute before:h-[2px] before:w-full before:bg-zinc-700"></div>
        {session?.user.email ? (
          <div className={menuItemClasses} onClick={() => signOut()}>
            <SignOut size={16} weight="bold" />
            <div className="leading-none">Sign Out</div>
          </div>
        ) : (
          <div className={menuItemClasses} onClick={handleSignInClick}>
            <UserCirclePlus size={16} weight="bold" />
            <div className="leading-none">Sign In</div>
          </div>
        )}
      </div>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={onSettingsClose}
        apiKey={localOpenAiApiKey}
        allowTelemetry={allowTelemetry}
        firstTimeUser={firstTimeUser}
      />
      <SignInModal
        apiKey={localOpenAiApiKey}
        allowTelemetry={allowTelemetry}
        isOpen={isSignInModalOpen}
        onClose={onSignInClose}
      />
    </>
  );
};

export default forwardRef(DropdownAccount);
