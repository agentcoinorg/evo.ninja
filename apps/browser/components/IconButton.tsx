import {
  IconProps,
  DownloadSimple,
  FilePlus,
  NotePencil,
  DiscordLogo,
  GithubLogo,
  Question,
  X,
} from "@phosphor-icons/react";
import clsx from "clsx";
import { ButtonHTMLAttributes, MouseEventHandler } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  buttonClassName?: string;
  iconClassName?: string;
  iconName:
    | "DownloadSimple"
    | "FilePlus"
    | "NotePencil"
    | "DiscordLogo"
    | "GithubLogo"
    | "Question"
    | "X";
  iconProps?: IconProps;
}

const IconButton = ({
  buttonClassName,
  iconClassName,
  iconName,
  onClick,
  iconProps,
  ...buttonProps
}: IconButtonProps) => {
  const iconSwitch = (
    iconName: IconButtonProps["iconName"],
    iconClassName?: IconButtonProps["iconClassName"],
    iconProps?: IconProps
  ) => {
    const defaultProps: IconProps = {
      className: clsx(
        "text-zinc-500 transition-colors ease-in-out group-hover:text-cyan-500",
        iconClassName
      ),
      weight: "bold",
      ...iconProps,
    };
    switch (iconName) {
      case "DownloadSimple":
        return <DownloadSimple {...defaultProps} />;
      case "FilePlus":
        return <FilePlus {...defaultProps} />;
      case "NotePencil":
        return <NotePencil {...defaultProps} />;
      case "DiscordLogo":
        return <DiscordLogo {...defaultProps} />;
      case "GithubLogo":
        return <GithubLogo {...defaultProps} />;
      case "Question":
        return <Question {...defaultProps} />;
      case "X":
        return <X {...defaultProps} />;
    }
  };
  return (
    <button
      className={clsx("group p-1.5", buttonClassName)}
      aria-label={iconName}
      onClick={onClick}
      {...buttonProps}
    >
      {iconSwitch(iconName, iconClassName, iconProps)}
    </button>
  );
};

export default IconButton;
