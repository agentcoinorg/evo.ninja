import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faUser } from "@fortawesome/free-solid-svg-icons";

import CloseIcon from "./CloseIcon";
import SidebarIcon from "./SidebarIcon";
import ChatList from "./ChatList";
import Worspace from "./Worspace";

export interface SidebarProps {
  onSettingsClick: () => void;
  onSidebarToggleClick: () => void;
}

const Sidebar = ({ onSettingsClick, onSidebarToggleClick }: SidebarProps) => {
  return (
    <div className="box-border flex h-full w-full flex-col items-center justify-between overflow-auto bg-opacity-black p-4">
      <div className="flex h-auto w-full flex-col items-center gap-4">
        <div className="flex w-full justify-end lg:hidden">
          <div
            className="flex cursor-pointer gap-2"
            onClick={onSidebarToggleClick}
          >
            <span>Close menu</span>
            <CloseIcon></CloseIcon>
          </div>
        </div>
        <div className="flex w-full items-center gap-3">
          <div
            className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-4 rounded border border-neutral-500 p-3 text-lg text-white opacity-80 transition-all hover:opacity-100"
            onClick={onSettingsClick}
          >
            <FontAwesomeIcon icon={faUser} />
            Account
          </div>
          <div
            className="h-14 cursor-pointer gap-4 rounded border border-neutral-500 p-4 text-lg text-white opacity-80 transition-all hover:opacity-100"
            onClick={onSidebarToggleClick}
          >
            <SidebarIcon />
          </div>
        </div>
        <Worspace />
        <ChatList />
      </div>
      <div className="box-border flex w-10/12 flex-col justify-center gap-2">
        <div className="flex justify-center">
          <img
            className="max-w-[16rem]"
            src="/avatar-name.png"
            alt="Main Logo"
          />
        </div>
        <div className="flex justify-center gap-4 text-lg text-white">
          <a
            className="cursor-pointer opacity-80 transition-all hover:opacity-100"
            href="https://discord.gg/r3rwh69cCa"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faDiscord} title="Support & Feedback" />
          </a>
          <div className="pointer-events-none">|</div>
          <a
            className="cursor-pointer opacity-80 transition-all hover:opacity-100"
            href="https://github.com/polywrap/evo.ninja"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faGithub} title="Star us on GitHub" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
