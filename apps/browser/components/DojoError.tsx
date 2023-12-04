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
      <div className="flex justify-between items-center p-4 border-b-2 border-neutral-700">
        <div className="h-14 p-4 text-lg text-white cursor-pointer hover:opacity-100 opacity-80 transition-all" onClick={onSidebarToggleClick}>
          { sidebarOpen ? <></>: <SidebarIcon /> }
        </div>
      </div>
      <div className="flex-1 overflow-auto p-5 text-left items-center">
        <div className="SenderName text-center text-lg font-semibold">Critical Error</div>
        <div className="my-4 rounded bg-teal-600 px-4 py-2.5 text-neutral-50">{typeof error === "string" ? error : JSON.stringify(error, null, 2)}</div>
      </div>
    </div>
  );
};

export default DojoError;
