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
  ...props
}: ButtonProps) => {
  const hierarchyClasses = {
    primary: "border-cyan-300 bg-cyan-500 hover:bg-cyan-600",
    secondary: "border-zinc-700 bg-zinc-800 hover:bg-zinc-700",
  };

  const sizeClasses = {
    default: "px-6 py-2 text-sm",
    lg: "px-8 py-3",
  };

  return (
    <button
      className={clsx(
        "inline-flex cursor-pointer items-center justify-center space-x-2 rounded-md border text-white transition-all",
        hierarchyClasses[hierarchy],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
