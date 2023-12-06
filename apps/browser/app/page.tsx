"use client";

import Chat from "@/components/Chat";
import SidebarIcon from "@/components/SidebarIcon";
import { examplePrompts } from "@/lib/examplePrompts";
import { sidebarAtom } from "@/lib/store";
import { useAtom } from "jotai";

function Dojo() {
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarAtom);

  const handleMessage = () => {

  }

  return (
    <Chat messages={[]} />
  );
}

export default Dojo;
