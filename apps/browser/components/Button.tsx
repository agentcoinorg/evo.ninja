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
    primary: clsx(
      "bg-button border-cyan-300 bg-gradient-to-b from-cyan-300 via-cyan-600 to-cyan-800 bg-bottom",
      {
        "hover:bg-top": !disabled,
      }
    ),
    secondary: clsx(
      "bg-button border-zinc-700 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 bg-bottom",
      {
        "hover:bg-top": !disabled,
      }
    ),
  };

  const sizeClasses = {
    default: "px-6 py-2 text-sm",
    lg: "px-8 py-3",
  };

  return (
    <button
      className={clsx(
        "text-shadow-md inline-flex items-center justify-center space-x-2 rounded-md border text-white transition-all duration-500",
        hierarchyClasses[hierarchy],
        sizeClasses[size],
        disabled ? "cursor-default opacity-60" : "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
