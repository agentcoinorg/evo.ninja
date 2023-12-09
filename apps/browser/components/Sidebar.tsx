import React, { memo, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { InMemoryFile } from "@nerfzael/memory-fs";
import clsx from "clsx";
import DropdownAccount from "./DropdownAccount";
import CurrentWorkspace from "./CurrentWorkspace";
import {
  DiscordLogo,
  GithubLogo,
  List,
  NotePencil,
  X,
} from "@phosphor-icons/react";
import AvatarBlockie from "./AvatarBlockie";
import Button from "./Button";
import CloseSidebarIcon from "./CloseSidebarIcon";
import useWindowSize from "@/lib/hooks/useWindowSize";

export interface SidebarProps {
  userFiles: InMemoryFile[];
  onUploadFiles: (files: InMemoryFile[]) => void;
}

const chats: string[] = ["New Chat", "Utilities Spending"];
// const chats: string[] = [];

const Sidebar = ({ userFiles, onUploadFiles }: SidebarProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isMobile } = useWindowSize();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(!isMobile);
  const [hoveringSidebarButton, setHovering] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

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
    <>
      {isMobile && (
        <>
          {sidebarOpen && (
            <div className="animate-fade-in fixed bottom-0 left-0 right-0 top-0 z-10 bg-zinc-900/50 opacity-0 backdrop-blur" />
          )}
          <header
            className={clsx(
              "absolute left-0 right-0 top-0 z-20 m-4 flex h-[52px] items-center",
              sidebarOpen ? "justify-end" : "justify-between"
            )}
          >
            {!sidebarOpen && (
              <Logo className="animate-fade-in w-[162px] cursor-pointer opacity-0 transition-opacity hover:opacity-50" />
            )}
            <Button
              variant="icon"
              className="!text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={32} /> : <List size={32} />}
            </Button>
          </header>
        </>
      )}
      <aside
        className={clsx(
          "fixed bottom-0 left-0 top-0 z-10 h-full border-r-2 bg-zinc-900 transition-all duration-300 ease-in-out md:relative",
          sidebarOpen
            ? "w-[calc(100%-72px)] md:w-[290px] md:min-w-[290px]"
            : "w-0 min-w-0 border-none",
          hoveringSidebarButton ? "border-zinc-500" : "border-zinc-800"
        )}
      >
        <div
          className={clsx(
            "flex h-full flex-col justify-between transition-opacity",
            {
              "opacity-50 delay-0 duration-300":
                sidebarOpen && hoveringSidebarButton,
              "pointer-events-none opacity-0 delay-0 duration-0": !sidebarOpen,
            }
          )}
        >
          <div
            className="animate-fade-in flex h-full flex-col justify-between opacity-0"
            style={{ animationDelay: sidebarOpen ? "150ms" : "0ms" }}
          >
            <div className="flex h-full flex-col space-y-6">
              <header>
                <Logo className="w-[162px] cursor-pointer p-4 transition-opacity hover:opacity-50" />
              </header>
              <div className="space-y-1 px-2">
                <div className="flex w-full items-center justify-between space-x-1 px-3">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">
                    Recent Chats
                  </div>
                  <Button variant="icon">
                    <NotePencil size={18} weight="bold" />
                  </Button>
                </div>
                <div className="space-y-0.5">
                  {chats.length > 0 ? (
                    <div className="px-2">
                      {chats.map((chat, i) => (
                        <div
                          key={i}
                          className="w-full cursor-pointer rounded p-1 text-zinc-100 transition-colors duration-300 hover:bg-zinc-800 hover:text-white"
                        >
                          {chat}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed border-zinc-500 p-7 text-center">
                      <NotePencil size={24} className="text-[currentColor]" />
                      <p className="leading-regular text-xs text-zinc-500">
                        You currently have no chats in your workspace.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <CurrentWorkspace
                userFiles={userFiles}
                onUploadFiles={onUploadFiles}
              />
            </div>
            <div className="relative flex h-auto w-full items-center justify-between p-4">
              <DropdownAccount ref={dropdownRef} dropdownOpen={dropdownOpen} />
              <div
                className={clsx(
                  "inline-flex w-full -translate-x-2 transform cursor-pointer items-center space-x-2 rounded-lg p-2 transition-colors hover:bg-zinc-800",
                  { "bg-zinc-800": dropdownOpen }
                )}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <AvatarBlockie
                  address={"0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8"}
                />
                <div className="text-white">Guest</div>
              </div>
              <div className="flex items-center space-x-1 text-lg text-white">
                <a
                  href="https://discord.gg/r3rwh69cCa"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="icon">
                    <DiscordLogo size={20} />
                  </Button>
                </a>
                <a
                  href="https://github.com/polywrap/evo.ninja"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="icon">
                    <GithubLogo size={20} />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
        {!isMobile && (
          <button
            className="absolute -right-8 top-1/2 z-10 cursor-pointer"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <CloseSidebarIcon
              hoveringSidebarButton={hoveringSidebarButton}
              sidebarOpen={sidebarOpen}
            />
          </button>
        )}
      </aside>
    </>
  );
};

export default memo(Sidebar);
