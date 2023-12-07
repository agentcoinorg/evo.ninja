import clsx from "clsx";
import { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface ButtonProps
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  hierarchy?: "primary" | "secondary";
  size?: "default" | "lg";
  variant?: "icon";
}

const Button = ({
  children,
  hierarchy = "primary",
  size = "default",
  variant,
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

  const variantClasses = {
    icon: "border-none bg-none !p-1 text-zinc-500 hover:text-cyan-500",
  };
  const variantClass = variant ? variantClasses[variant] : null;

  return (
    <button
      className={clsx(
        "text-shadow-md inline-flex items-center justify-center space-x-2 rounded-md border text-white transition-all duration-500",
        hierarchyClasses[hierarchy],
        sizeClasses[size],
        variantClass,
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
