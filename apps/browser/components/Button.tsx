import clsx from "clsx";
import { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface ButtonProps
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  hierarchy?: "primary" | "secondary";
  size?: "default" | "lg";
}

const Button = ({
  children,
  hierarchy = "primary",
  size = "default",
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const hierarchyClasses = {
    primary: clsx("border-cyan-300 bg-cyan-500", {
      "hover:bg-cyan-600": !disabled,
    }),
    secondary: clsx("border-zinc-700 bg-zinc-800", {
      "hover:bg-zinc-700": !disabled,
    }),
  };

  const sizeClasses = {
    default: "px-6 py-2 text-sm",
    lg: "px-8 py-3",
  };

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center space-x-2 rounded-md border text-white transition-all",
        hierarchyClasses[hierarchy],
        sizeClasses[size],
        disabled ? "opacity-60 cursor-default" : "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
