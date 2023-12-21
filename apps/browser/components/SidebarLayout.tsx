"use client";

import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";

import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import { sidebarAtom } from "@/lib/store";
import CloseSidebarIcon from "./CloseSidebarIcon";
import useWindowSize from "@/lib/hooks/useWindowSize";
import Button from "./Button";
import { List, X } from "@phosphor-icons/react";
import WelcomeModal from "./modals/WelcomeModal";
import { welcomeModalAtom } from "@/lib/store";
import { useHydrateAtoms } from "jotai/utils";

export default function SidebarLayout(props: {
  children: React.ReactNode;
  isMobile: boolean;
}) {
  useHydrateAtoms([[sidebarAtom, !props.isMobile]]);
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarAtom);
  const [hoveringSidebarButton, setHovering] = useState<boolean>(false);
  const { isMobile } = useWindowSize();
  const [welcomeModalOpen, setWelcomeModalOpen] = useAtom(welcomeModalAtom);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  return (
    <>
      <div className="relative flex h-screen overflow-hidden">
        <>
          {isMobile && (
            <>
              {sidebarOpen && (
                <div className="fixed bottom-0 left-0 right-0 top-0 z-10 animate-fade-in bg-zinc-900/50 opacity-0 backdrop-blur" />
              )}
              <header
                className={clsx(
                  "absolute left-0 right-0 top-0 z-20 m-4 flex h-[52px] items-center",
                  sidebarOpen ? "justify-end" : "justify-between"
                )}
              >
                <Button
                  variant="icon"
                  className="!text-white"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {!sidebarOpen ? <List size={32} /> : <X size={32} />}
                </Button>
              </header>
            </>
          )}
          <aside
            className={clsx(
              "fixed bottom-0 left-0 top-0 z-10 h-full border-r-2 bg-zinc-900 transition-all duration-300 ease-in-out md:relative",
              sidebarOpen
                ? "w-[calc(100%-72px)] md:w-sidebar md:min-w-sidebar"
                : "w-0 min-w-0 border-none",
              hoveringSidebarButton ? "border-zinc-500" : "border-zinc-800"
            )}
          >
            <Sidebar
              hoveringSidebarButton={hoveringSidebarButton}
              sidebarOpen={!!sidebarOpen}
              closeSidebar={() => setSidebarOpen(false)}
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
                  sidebarOpen={!!sidebarOpen}
                />
              </button>
            )}
          </aside>
        </>
        {props.children}
      </div>
      <WelcomeModal
        isOpen={welcomeModalOpen}
        onClose={() => setWelcomeModalOpen(false)}
      />
    </>
  );
}
