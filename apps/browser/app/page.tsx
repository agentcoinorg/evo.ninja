"use client";

import SidebarIcon from "@/components/SidebarIcon";
import { examplePrompts } from "@/lib/examplePrompts";
import { sidebarAtom } from "@/lib/store";
import { useAtom } from "jotai";

function Dojo() {
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarAtom);

  const handleMessage = () => {

  }
  return (
    <div className="flex h-full flex-col bg-[#0A0A0A] text-white">
      <div className="flex items-center justify-between border-b-2 border-neutral-700 p-4">
        {/* Evo.ninja */}
        <div
          className="h-14 cursor-pointer p-4 text-lg text-white opacity-80 transition-all hover:opacity-100"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <></> : <SidebarIcon />}
        </div>
      </div>
      <div className="grid w-[100%] w-full max-w-[56rem] grid-rows-2 self-center p-2.5 py-16">
        {examplePrompts.map((prompt, index) => (
          <div
            key={index}
            className="m-1 cursor-pointer rounded-xl border border-neutral-500 bg-neutral-800 p-2.5 text-left text-xs text-neutral-50 transition-all hover:border-orange-500"
            onClick={handleMessage}
          >
            {prompt.prompt}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dojo;
