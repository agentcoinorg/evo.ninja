"use client"

import React from "react";
import { useAtom } from "jotai";

import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import { showAccountModalAtom, sidebarAtom } from "@/lib/store";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [, setAccountModalOpen] = useAtom(showAccountModalAtom);
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarAtom);

  return (
    <>
      <div className="flex h-full bg-neutral-800 bg-landing-bg bg-repeat text-center text-neutral-400">
        <div
          className={clsx("relative w-full lg:w-auto lg:max-w-xs", {
            hidden: !sidebarOpen,
          })}
        >
          <Sidebar
            onSidebarToggleClick={() => {
              setSidebarOpen(!sidebarOpen);
            }}
            onSettingsClick={() => setAccountModalOpen(true)}
          />
        </div>
        <div
          className={clsx("relative grow border-l-2 border-neutral-700", {
            "max-lg:hidden": sidebarOpen,
          })}
        >
          {children}
        </div>
      </div>
    </>
  );
}
