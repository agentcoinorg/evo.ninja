import clsx from "clsx";
import { ReactNode } from "react";

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
    <div
      className={clsx(
        "absolute !m-0 w-[250px] max-w-[240px] max-w-xl rounded-lg bg-zinc-900 p-2 text-white shadow-md backdrop-blur",
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
    </div>
  );
};

export default Tooltip;
