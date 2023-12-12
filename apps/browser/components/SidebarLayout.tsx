"use client";

import React, { useState } from "react";
import { useAtom } from "jotai";

import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import { sidebarAtom, uploadedFilesAtom, userFilesAtom } from "@/lib/store";
import CloseSidebarIcon from "./CloseSidebarIcon";
import useWindowSize from "@/lib/hooks/useWindowSize";
import Logo from "./Logo";
import Button from "./Button";
import { List, X } from "@phosphor-icons/react";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarAtom);
  const [userFiles] = useAtom(userFilesAtom);
  const [, setUploadedFiles] = useAtom(uploadedFilesAtom);
  const [hoveringSidebarButton, setHovering] = useState<boolean>(false);
  const { isMobile } = useWindowSize();

  return (
    <>
      <div className="relative flex h-screen overflow-hidden">
        {/* <div className="pointer-events-none fixed inset-0 bottom-0 left-0 right-0 top-0 overflow-clip">
          <div className="mix-blend-softlight absolute -bottom-1/4 left-1/3 h-screen w-7/12 rotate-[-30deg] rounded-full bg-gradient-to-b from-cyan-500/40 to-cyan-700/10 opacity-30 blur-[128px]" />
          <div className="mix-blend-softlight absolute -bottom-1/4 left-[65%] h-[50vh] w-4/12 rotate-[30deg] rounded-full bg-gradient-to-b from-pink-500/40 to-pink-600/20 opacity-10 blur-[128px]" />
        </div> */}
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
                  <a href="/">
                    <Logo
                      wordmark={false}
                      className="animate-fade-in w-8 cursor-pointer opacity-0 transition-opacity hover:opacity-50"
                    />
                  </a>
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
            <Sidebar
              hoveringSidebarButton={hoveringSidebarButton}
              sidebarOpen={sidebarOpen}
              // onSettingsClick={() => setAccountModalOpen(true)}
              userFiles={userFiles}
              onUploadFiles={setUploadedFiles}
              setHovering={setHovering}
              setSidebarOpen={setSidebarOpen}
            />
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
        {/* <div
          className={clsx("relative grow", {
            "max-lg:hidden": sidebarOpen,
          })}
        > */}
        {children}
        {/* </div> */}
      </div>
    </>
  );
}
