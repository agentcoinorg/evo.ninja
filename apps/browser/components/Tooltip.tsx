import clsx from "clsx";
import { ReactNode } from "react";
import { Popover } from "@headlessui/react";

export interface TooltipProps {
  content: ReactNode | string;
  placement?: "top" | "bottom" | "left" | "right";
}

const Tooltip = ({ content, placement = "top" }: TooltipProps) => {
  const placementClasses = {
    top: {
      tooltip: "bottom-[calc(100%+12px)]",
      arrow: "-bottom-1.5 left-1/2 -translate-x-1/2",
    },
    bottom: {
      tooltip: "top-[calc(100%+12px)]",
      arrow: "-top-1.5 left-1/2 -translate-x-1/2",
    },
    left: {
      tooltip: "right-[calc(100%+12px)]",
      arrow: "-right-1.5 top-1/2 -translate-y-1/2",
    },
    right: {
      tooltip: "left-[calc(100%+12px)]",
      arrow: "-left-1.5 top-1/2 -translate-y-1/2",
    },
  };

  const tooltipClasses = placement ? placementClasses[placement].tooltip : null;
  const arrowClasses = placement ? placementClasses[placement].arrow : null;

  return (
    <Popover.Panel
      static
      className={clsx(
        "absolute z-20 !m-0 w-max max-w-[240px] animate-[fade_100ms_ease-in-out_200ms_forwards] rounded-lg bg-zinc-700 p-2 text-white opacity-0 shadow-md backdrop-blur",
        tooltipClasses
      )}
    >
      <div className="text-xs">{content}</div>
      <div
        className={clsx(
          "absolute h-3 w-3 rotate-45 transform bg-inherit",
          arrowClasses
        )}
      />
    </Popover.Panel>
  );
};

export default Tooltip;
