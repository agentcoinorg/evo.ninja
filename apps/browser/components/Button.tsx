import clsx from "clsx";
import { Popover } from "@headlessui/react";
import { ButtonHTMLAttributes, PropsWithChildren, useState } from "react";
import Tooltip, { TooltipProps } from "./Tooltip";

interface ButtonProps
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  hierarchy?: "primary" | "secondary";
  size?: "default" | "lg";
  variant?: "icon" | "text";
  helperContent?: TooltipProps["content"];
  helperPlacement?: TooltipProps["placement"];
}

const Button = ({
  children,
  hierarchy = "primary",
  size = "default",
  variant,
  helperContent,
  helperPlacement,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const hierarchyClasses = {
    primary: clsx(
      "bg-button border-cyan-300 bg-gradient-to-b from-cyan-300 via-cyan-600 to-cyan-800 bg-bottom text-white",
      {
        "hover:bg-top": !disabled,
      }
    ),
    secondary: clsx(
      "bg-button border-zinc-700 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 bg-bottom text-white",
      {
        "hover:bg-top": !disabled,
      }
    ),
  };

  const sizeClasses = {
    default: "px-6 py-2 text-sm",
    lg: "px-8 py-3",
  };

  const variantClasses = {
    icon: "border-none bg-none !p-1 text-zinc-500 hover:!text-cyan-500",
    text: "border-none bg-none !p-1 text-cyan-500 hover:text-white",
  };
  const variantClass = variant ? variantClasses[variant] : null;

  return (
    <Popover className="relative">
      <Popover.Button
        // as="button"
        className={clsx(
          "text-shadow-md relative inline-flex items-center justify-center space-x-2 rounded-md border transition-all duration-500",
          hierarchyClasses[hierarchy],
          sizeClasses[size],
          variantClass,
          disabled ? "cursor-default opacity-60" : "cursor-pointer",
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        {...props}
      >
        {children}
        {helperContent && showTooltip && (
          <Tooltip placement={helperPlacement} content={helperContent} />
        )}
      </Popover.Button>
    </Popover>
  );
};

export default Button;
