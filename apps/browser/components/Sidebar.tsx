import React, { memo, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { InMemoryFile } from "@nerfzael/memory-fs";
import clsx from "clsx";
import DropdownAccount from "./DropdownAccount";
import CurrentWorkspace from "./CurrentWorkspace";
import { DiscordLogo, GithubLogo, NotePencil } from "@phosphor-icons/react";
import AvatarBlockie from "./AvatarBlockie";
import Button from "./Button";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { useChats } from "@/lib/queries/useChats";
import { useRouter, usePathname } from "next/navigation";
import { v4 as uuid } from "uuid";
import useWindowSize from "@/lib/hooks/useWindowSize";
import { useSession } from "next-auth/react";

export interface SidebarProps {
  userFiles: InMemoryFile[];
  onUploadFiles: (files: InMemoryFile[]) => void;
  hoveringSidebarButton: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (set: boolean) => void;
}

const Sidebar = ({
  userFiles,
  onUploadFiles,
  sidebarOpen,
  hoveringSidebarButton,
  setSidebarOpen,
}: SidebarProps) => {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { mutateAsync: createChat } = useCreateChat();
  const { data: chats } = useChats();
  const { data: session } = useSession();
  const mappedChats = chats?.map((chat) => ({
    id: chat.id,
    name: chat.logs[0]?.title ?? "New session",
  }));
  const { isMobile } = useWindowSize();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const createNewChat = async () => {
    const id = uuid();
    const createdChat = await createChat(id);
    router.push(`/chat/${createdChat.id}`);
  };

  const handleChatClick = (id: string) => {
    () => router.push(`/chat/${id}`);
  };

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
          className="animate-fade-in flex h-full flex-col justify-between opacity-0"
          style={{ animationDelay: sidebarOpen ? "150ms" : "0ms" }}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-6">
              <header>
                <button onClick={createNewChat}>
                  <Logo className="w-[162px] cursor-pointer p-4 transition-opacity hover:opacity-50" />
                </button>
              </header>
              <div className="space-y-1 px-2">
                <div className="flex w-full items-center justify-between space-x-1 px-3">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">
                    Recent Chats
                  </div>
                  <Button variant="icon" onClick={createNewChat}>
                    <NotePencil size={18} weight="bold" />
                  </Button>
                </div>
                <div className="h-full max-h-[30vh] space-y-0.5 overflow-y-auto">
                  {chats && chats.length > 0 ? (
                    <div className="px-2">
                      {mappedChats?.map((chat, i) => (
                        <div
                          key={chat.id}
                          data-id={chat.id}
                          className="w-full cursor-pointer overflow-x-hidden text-ellipsis whitespace-nowrap rounded p-1 text-sm text-zinc-100 transition-colors duration-300 hover:bg-zinc-700 hover:text-white md:text-base"
                          onClick={() => handleChatClick(chat.id)}
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
            <div className="relative flex w-full items-center justify-between p-4">
              <DropdownAccount ref={dropdownRef} dropdownOpen={dropdownOpen} />
              <div
                className={clsx(
                  "inline-flex w-full -translate-x-2 transform cursor-pointer items-center space-x-2 rounded-lg p-2 transition-colors hover:bg-zinc-800",
                  { "bg-zinc-800": dropdownOpen }
                )}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {session?.user.email ? (
                  <>
                    <div className="flex items-center space-x-2">
                      {session.user.image ? (
                        <img
                          src={session.user.image}
                          className="h-8 w-8 rounded-full bg-yellow-500"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-yellow-500" />
                      )}
                      <div className="space-y-1">
                        <div className="text-sm font-semibold leading-none">
                          {session.user.name}
                        </div>
                        <div className="text-[12px] leading-none text-gray-400">
                          {session.user.email}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <AvatarBlockie
                      size={32}
                      address={"0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8"}
                    />
                    <div className="text-white">Guest</div>
                  </>
                )}
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
      </div>
    </>
  );
};

export default memo(Sidebar);
