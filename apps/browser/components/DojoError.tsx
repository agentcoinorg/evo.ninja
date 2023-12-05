import React from "react";
import SidebarIcon from "./SidebarIcon";

export interface DojoErrorProps {
  error: unknown;
  sidebarOpen: boolean;
  onSidebarToggleClick: () => void;
}

const DojoError: React.FC<DojoErrorProps> = (props: DojoErrorProps) => {
  const { error, sidebarOpen, onSidebarToggleClick } = props;

  return (
    <div className="flex h-full flex-col bg-[#0A0A0A] text-white">
      <div className="flex items-center justify-between border-b-2 border-zinc-700 p-4">
        <div
          className="h-14 cursor-pointer p-4 text-lg text-white opacity-80 transition-all hover:opacity-100"
          onClick={onSidebarToggleClick}
        >
          {sidebarOpen ? <></> : <SidebarIcon />}
        </div>
      </div>
      <div className="flex-1 items-center overflow-auto p-5 text-left">
        <div className="SenderName text-center text-lg font-semibold">
          Critical Error
        </div>
        <div className="my-4 rounded bg-cyan-500 px-4 py-2.5 text-zinc-50">
          {typeof error === "string" ? error : JSON.stringify(error, null, 2)}
        </div>
      </div>
    </div>
  );
};

export default DojoError;
