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
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { useChats } from "@/lib/queries/useChats";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import useWindowSize from "@/lib/hooks/useWindowSize";

export interface SidebarProps {
  userFiles: InMemoryFile[];
  onUploadFiles: (files: InMemoryFile[]) => void;
  hoveringSidebarButton: boolean;
  sidebarOpen: boolean;
  setHovering: (set: boolean) => void;
  setSidebarOpen: (set: boolean) => void;
}

// const chats: string[] = ["New Chat", "Utilities Spending"];
// const chats: string[] = [];

const Sidebar = ({
  userFiles,
  onUploadFiles,
  sidebarOpen,
  hoveringSidebarButton,
  setSidebarOpen,
  setHovering,
}: SidebarProps) => {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { mutateAsync: createChat } = useCreateChat();
  const { data: chats } = useChats();
  const mappedChats = chats?.map((chat) => ({
    id: chat.id,
    name: chat.logs[0]?.title ?? "New session",
  }));
  const { isMobile } = useWindowSize();
  // const [sidebarOpen, setSidebarOpen] = useState<boolean>(!isMobile);
  // const [hoveringSidebarButton, setHovering] = useState<boolean>(false);
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
          className="flex h-full animate-fade-in flex-col justify-between opacity-0"
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
                <Button
                  variant="icon"
                  onClick={async () => {
                    const id = uuid();
                    const createdChat = await createChat(id);
                    router.push(`/chat/${createdChat.id}`);
                  }}
                >
                  <NotePencil size={18} weight="bold" />
                </Button>
              </div>
              <div className="space-y-0.5">
                {chats && chats.length > 0 ? (
                  <div className="px-2">
                    {mappedChats?.map((chat, i) => (
                      <div
                        key={i}
                        className="w-full cursor-pointer rounded p-1 text-zinc-100 transition-colors duration-300 hover:bg-zinc-800 hover:text-white"
                        onClick={() => router.push(`/chat/${chat.id}`)}
                      >
                        {chat.name}
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
    </>
  );
};

export default memo(Sidebar);
