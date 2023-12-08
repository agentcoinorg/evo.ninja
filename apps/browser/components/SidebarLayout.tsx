"use client"

import React, { useState } from "react";
import { useAtom } from "jotai";

import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import { sidebarAtom, uploadedFilesAtom, userFilesAtom } from "@/lib/store";
import CloseSidebarIcon from "./CloseSidebarIcon";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarAtom);
  const [userFiles] = useAtom(userFilesAtom);
  const [, setUploadedFiles] = useAtom(uploadedFilesAtom);
  const [hoveringSidebarButton, setHovering] = useState<boolean>(false);
  return (
    <>
       <div className="relative flex h-full overflow-x-clip">
        <div className="pointer-events-none fixed inset-0 bottom-0 left-0 right-0 top-0 overflow-clip">
          <div className="mix-blend-softlight absolute -bottom-1/4 left-1/3 h-screen w-7/12 rotate-[-30deg] rounded-full bg-gradient-to-b from-cyan-500/40 to-cyan-700/10 opacity-30 blur-[128px]" />
          <div className="mix-blend-softlight absolute -bottom-1/4 left-[65%] h-[50vh] w-4/12 rotate-[30deg] rounded-full bg-gradient-to-b from-pink-500/40 to-pink-600/20 opacity-10 blur-[128px]" />
        </div>
        <div className="relative w-full transition-transform lg:w-auto lg:max-w-md">
          <Sidebar
            hoveringSidebarButton={hoveringSidebarButton}
            sidebarOpen={sidebarOpen}
            // onSettingsClick={() => setAccountModalOpen(true)}
            userFiles={userFiles}
            onUploadFiles={setUploadedFiles}
          />
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
        </div>
        <div
          className={clsx("relative grow", {
            "max-lg:hidden": sidebarOpen,
          })}
        >
          {children}
        </div>
      </div>
    </>
  );
}
