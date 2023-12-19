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
  capReachedAtom,
  settingsModalAtom,
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
  const { data: session } = useSession();
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useAtom(settingsModalAtom);
  const [isSignInModalOpen, setIsSignInModalOpen] = useAtom(signInModalAtom);
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
          <div className="dropdown-menu-item" onClick={handleAccountSettingsClick}>
            <GearSix size={16} weight="bold" />
            <div className="leading-none">Account Settings</div>
          </div>
        )}
        <a
          className="dropdown-menu-item"
          href="https://discord.gg/r3rwh69cCa"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Question size={16} weight="bold" />
          <div className="leading-none">Support</div>
        </a>
        <div className="relative w-full py-2 before:absolute before:h-[2px] before:w-full before:bg-zinc-700"></div>
        {session?.user.email ? (
          <div className="dropdown-menu-item" onClick={() => signOut()}>
            <SignOut size={16} weight="bold" />
            <div className="leading-none">Sign Out</div>
          </div>
        ) : (
          <div className="dropdown-menu-item" onClick={handleSignInClick}>
            <UserCirclePlus size={16} weight="bold" />
            <div className="leading-none">Sign In</div>
          </div>
        )}
      </div>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={onSettingsClose}
      />
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={onSignInClose}
      />
    </>
  );
};

export default forwardRef(DropdownAccount);
