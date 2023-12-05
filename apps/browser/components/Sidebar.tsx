import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";
import Logo from "./Logo";
import { DownloadSimple, FilePlus, NotePencil } from "@phosphor-icons/react";
import IconButton from "./IconButton";

import { downloadFilesAsZip } from "@/lib/sys/file/downloadFilesAsZip";
import { InMemoryFile } from "@nerfzael/memory-fs";
import clsx from "clsx";
import DropdownAccount from "./DropdownAccount";

export interface SidebarProps {
  userFiles: InMemoryFile[];
  onUploadFiles: (files: InMemoryFile[]) => void;
  hoveringSidebarButton: boolean;
  sidebarOpen: boolean;
}

const Sidebar = ({
  userFiles,
  onUploadFiles,
  sidebarOpen,
  hoveringSidebarButton,
}: SidebarProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  function downloadUserFiles() {
    downloadFilesAsZip("workspace.zip", userFiles);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    // Bind the event listener
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Unbind the event listener on clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div
      className={clsx(
        "overflow-y relative z-10 h-full border-r-2 bg-zinc-900 transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-[290px] p-4" : "w-0 border-none p-0",
        hoveringSidebarButton ? "border-zinc-500" : "border-zinc-700"
      )}
    >
      <div
        className={clsx(
          "flex h-full flex-col justify-between transition-opacity",
          {
            "opacity-50 delay-0": sidebarOpen && hoveringSidebarButton,
            "hidden delay-0 duration-0": !sidebarOpen,
          }
        )}
      >
        <div
          className="animate-fade-in flex h-full flex-col justify-between opacity-0"
          style={{ animationDelay: sidebarOpen ? "150ms" : "0ms" }}
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Logo className="cursor-pointer transition-opacity hover:opacity-50" />
              <IconButton
                iconName="NotePencil"
                size={20}
                buttonClassName="rounded-full border border-cyan-600 bg-cyan-500 p-1.5 hover:bg-cyan-600 transition-colors duration-300"
                iconClassName="text-cyan-100 group-hover:text-white"
              />
            </div>
            <div className="space-y-1">
              <div className="flex w-full items-center justify-between space-x-1">
                <div className="text-xs uppercase tracking-widest text-zinc-500">
                  Recent Chats
                </div>
                <IconButton iconName="NotePencil" size={18} />
              </div>
              <div className="space-y-0.5">
                {["New Chat", "Utilities Spending"].map((chat, i) => (
                  <div
                    key={i}
                    className="text-zinc-180 w-[calc(100%+0.5rem)] -translate-x-2 transform cursor-pointer rounded p-2 transition-colors duration-300 hover:bg-zinc-800 hover:text-white"
                  >
                    {chat}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex w-full items-center justify-between space-x-1">
              <div className="text-xs uppercase tracking-widest text-zinc-500">
                Current Workspace
              </div>
              <div className="flex items-center space-x-1">
                <IconButton iconName="FilePlus" size={18} />
                <IconButton iconName="DownloadSimple" size={18} />
              </div>
            </div>
          </div>
          <div className="relative flex w-full items-center justify-between">
            <DropdownAccount ref={dropdownRef} dropdownOpen={dropdownOpen} />
            <div
              className={clsx(
                "inline-flex w-full -translate-x-2 transform cursor-pointer items-center space-x-2 rounded-lg p-2 transition-colors hover:bg-zinc-800",
                { "bg-zinc-800": dropdownOpen }
              )}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="h-6 w-6 rounded-full bg-yellow-500"></div>
              <div className="text-white">Guest</div>
            </div>
            <div className="flex items-center space-x-1 text-lg text-white">
              <a
                href="https://discord.gg/r3rwh69cCa"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconButton iconName="DiscordLogo" size={20} weight="bold" />
              </a>
              <a
                href="https://github.com/polywrap/evo.ninja"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconButton iconName="GithubLogo" size={20} weight="bold" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
