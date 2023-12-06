"use client"

import React, { useState } from "react";
import { useAtom } from "jotai";

import clsx from "clsx";
import Sidebar from "@/components/Sidebar";
import { showAccountModalAtom } from "@/lib/store";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [, setAccountModalOpen] = useAtom(showAccountModalAtom);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <div className="flex h-full bg-neutral-800 bg-landing-bg bg-repeat text-center text-neutral-400">
        <div
          className={clsx("relative w-full lg:w-auto lg:max-w-md", {
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
