import { isChatLoadingAtom, workspaceAtom, chatInfoAtom } from "@/lib/store";
import { useCreateChat } from "@/lib/mutations/useCreateChat";
import { useDeleteChat } from "@/lib/mutations/useDeleteChat";
import { useUpdateChatTitle } from "@/lib/mutations/useUpdateChatTitle";
import { useChats } from "@/lib/queries/useChats";
import useWindowSize from "@/lib/hooks/useWindowSize";
import { useWorkspaceUploadUpdate } from "@/lib/hooks/useWorkspaceUploadUpdate";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import TextField from "@/components/inputs/TextField";
import DropdownAccount from "@/components/DropdownAccount";
import Workspace from "@/components/Workspace";
import React, { memo, useEffect, useRef, useState } from "react";
import {
  DiscordLogo,
  GithubLogo,
  NotePencil,
  PencilSimple,
  TrashSimple,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { v4 as uuid } from "uuid";
import { useAtom } from "jotai";
import clsx from "clsx";
import { InMemoryFile } from "@nerfzael/memory-fs";

export interface SidebarProps {
  hoveringSidebarButton: boolean;
  sidebarOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar = ({
  sidebarOpen,
  hoveringSidebarButton,
  closeSidebar,
}: SidebarProps) => {
  const router = useRouter();
  const { data: chats, isLoading: isLoadingChats } = useChats();
  const { data: session, status } = useSession();
  const { isMobile } = useWindowSize();

  const [editChat, setEditChat] = useState<{ id: string; title: string }>();
  const [activeChat, setActiveChat] = useState<string | undefined>(undefined);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editTitleInputRef = useRef<HTMLInputElement>(null);

  const mappedChats = chats?.map((chat) => ({
    id: chat.id,
    name: chat.title ?? "New session",
  }));

  const { mutateAsync: createChat } = useCreateChat();
  const { mutateAsync: deleteChat } = useDeleteChat();
  const { mutateAsync: updateChat } = useUpdateChatTitle();
  const [{ id: chatId }] = useAtom(chatInfoAtom);
  const [isChatLoading, setIsChatLoading] = useAtom(isChatLoadingAtom);
  const [workspace] = useAtom(workspaceAtom);

  const workspaceUploadUpdate = useWorkspaceUploadUpdate();

  const handleCreateNewChat = async () => {
    const id = uuid();
    await createChat(id);
    router.push(`/chat/${id}`);
    setIsChatLoading(true);
    if (isMobile) {
      closeSidebar();
    }
  };

  const handleChatClick = (id: string, name: string) => {
    if (!editChat) {
      router.push(`/chat/${id}`);
      if (isMobile) {
        closeSidebar();
      }
    }
  };

  const handleChatNameEdit = async (id: string, title: string) => {
    // If user is editing the name of the chat it curretly is, also modify it in the chat header
    if (title) {
      await updateChat({ chatId: id, title });
    }
    setEditChat(undefined);
  };

  const handleChatDelete = async (id: string) => {
    // Remove files associated to chat before removing chat
    await workspace?.rmdir("", { recursive: true });
    await deleteChat(id);
    router.replace("/");
    if (isMobile) {
      closeSidebar();
    }
  };

  useEffect(() => {
    if (activeChat !== chatId) {
      setActiveChat(chatId);
    }
  }, [chatId, activeChat]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editTitleInputRef.current &&
        !editTitleInputRef.current.contains(event.target as Node)
      ) {
        setEditChat(undefined);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editTitleInputRef]);

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
          <div className="flex h-full flex-col justify-between">
            <div className={clsx({ "space-y-6": session?.user.email })}>
              <header onClick={() => router.replace("/")}>
                <Logo className="w-[162px] cursor-pointer p-4 transition-opacity hover:opacity-50" />
              </header>
              {session?.user.email && (
                <div className="space-y-1 px-2">
                  <div className="flex w-full items-center justify-between space-x-1 px-3">
                    <div className="text-xs uppercase tracking-widest text-zinc-500">
                      Recent Chats
                    </div>
                    {!isLoadingChats && (
                      <Button variant="icon" onClick={handleCreateNewChat}>
                        <NotePencil size={18} weight="bold" />
                      </Button>
                    )}
                  </div>
                  {!isLoadingChats ? (
                    <div className="h-full max-h-[30vh] space-y-0.5 overflow-y-auto [scrollbar-gutter:stable]">
                      {chats && chats.length > 0 ? (
                        <div className="px-2">
                          {mappedChats?.map((chat) => (
                            <div
                              key={chat.id}
                              data-id={chat.id}
                              className={clsx(
                                "relative w-full cursor-pointer overflow-x-hidden text-ellipsis whitespace-nowrap rounded p-1 text-sm text-zinc-100 transition-colors duration-300",
                                {
                                  "bg-zinc-700 pr-14":
                                    chat.id === activeChat &&
                                    chat.id !== editChat?.id,
                                },
                                {
                                  "hover:bg-zinc-700 hover:text-white":
                                    chat.id !== editChat?.id,
                                }
                              )}
                              onClick={() =>
                                handleChatClick(chat.id, chat.name)
                              }
                            >
                              {chat.id === editChat?.id ? (
                                <div ref={editTitleInputRef}>
                                  <TextField
                                    className="!border-none !p-1 focus:!bg-zinc-950"
                                    defaultValue={chat.name}
                                    onKeyDown={async (e) => {
                                      if (e.key === "Enter") {
                                        await handleChatNameEdit(
                                          chat.id,
                                          e.currentTarget.value
                                        );
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                chat.name
                              )}
                              <div
                                className={clsx(
                                  "absolute right-1 top-1/2 -translate-y-1/2 transform animate-fade-in items-center",
                                  chat.id === activeChat &&
                                    chat.id !== editChat?.id
                                    ? "flex"
                                    : "hidden opacity-0"
                                )}
                              >
                                <Button
                                  onClick={() =>
                                    setEditChat({
                                      id: chat.id,
                                      title: chat.name,
                                    })
                                  }
                                  variant="icon"
                                  className="!text-white"
                                >
                                  <PencilSimple weight="bold" size={16} />
                                </Button>
                                <Button
                                  onClick={() => handleChatDelete(chat.id)}
                                  variant="icon"
                                  className="!text-white"
                                >
                                  <TrashSimple weight="bold" size={16} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          onClick={handleCreateNewChat}
                          className="mt-1 flex cursor-pointer flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed border-zinc-500 p-7 text-center transition-colors duration-300 hover:border-cyan-500 hover:bg-zinc-950 hover:text-cyan-500"
                        >
                          <NotePencil
                            size={24}
                            className="text-[currentColor]"
                          />
                          <p className="leading-regular text-xs text-zinc-500">
                            You currently have no chats.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mx-2 h-[20vh] w-[calc(100%-1rem)] animate-pulse rounded-lg bg-zinc-700" />
                  )}
                </div>
              )}
              <Workspace
                onUpload={(uploads: InMemoryFile[]) => {
                  if (!chatId && !isChatLoading) {
                    handleCreateNewChat();
                  } else if (workspace) {
                    workspaceUploadUpdate(workspace, uploads);
                  }
                }}
              />
            </div>
            <div className="relative flex w-full items-center justify-between space-x-2 p-4">
              {status !== "loading" ? (
                <>
                  <DropdownAccount
                    ref={dropdownRef}
                    dropdownOpen={dropdownOpen}
                  />
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
                              className="h-8 w-8 min-w-[2rem] rounded-full bg-cyan-600"
                            />
                          ) : (
                            <div className="h-8 w-8 min-w-[2rem] rounded-full bg-cyan-600" />
                          )}
                          <div className="w-full max-w-[124px] space-y-1 overflow-x-hidden">
                            <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-none">
                              {session.user.name}
                            </div>
                            <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-none text-gray-400">
                              {session.user.email}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Avatar size={32} />
                        <div className="text-white">Guest</div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-12 w-full animate-pulse rounded-lg bg-zinc-700" />
              )}
              <div className="flex items-center space-x-1 text-lg text-white">
                <Button
                  variant="icon"
                  onClick={() => {
                    window.open(
                      "https://discord.gg/k7UCsH3ps9",
                      "_blank",
                      "noopener noreferrer"
                    );
                  }}
                >
                  <DiscordLogo size={20} />
                </Button>
                <Button
                  variant="icon"
                  onClick={() => {
                    window.open(
                      "https://github.com/polywrap/evo.ninja",
                      "_blank",
                      "noopener noreferrer"
                    );
                  }}
                >
                  <GithubLogo size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(Sidebar);
