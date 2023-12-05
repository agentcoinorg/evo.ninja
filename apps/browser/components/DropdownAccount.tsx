import { GearSix, UserCirclePlus } from "@phosphor-icons/react";
import clsx from "clsx";
import React, { forwardRef } from "react";

interface DropdownAccountProps {
  dropdownOpen: boolean;
}

const DropdownAccount: React.ForwardRefRenderFunction<
  HTMLDivElement,
  DropdownAccountProps
> = ({ dropdownOpen }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        "animate-fade-in absolute -left-2 bottom-[calc(100%+8px)] w-[272px] space-y-1 rounded-lg border-2 border-zinc-700 bg-zinc-800 p-2 shadow-lg",
        { hidden: !dropdownOpen }
      )}
    >
      <div className="flex w-full cursor-pointer items-center space-x-2 rounded-md p-2 text-zinc-100 transition-colors duration-300 hover:bg-zinc-700 hover:text-white">
        <GearSix size={16} weight="bold" />
        <div className="leading-none">Account Settings</div>
      </div>
      <div className="flex w-full cursor-pointer items-center space-x-2 rounded-md p-2 text-zinc-100 transition-colors duration-300 hover:bg-zinc-700 hover:text-white">
        <UserCirclePlus size={16} weight="bold" />
        <div className="leading-none">Sign In</div>
      </div>
    </div>
  );
};

export default forwardRef(DropdownAccount);
