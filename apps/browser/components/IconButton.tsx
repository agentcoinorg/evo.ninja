import {
  IconProps,
  DownloadSimple,
  FilePlus,
  NotePencil,
  DiscordLogo,
  GithubLogo,
  X,
} from "@phosphor-icons/react";
import clsx from "clsx";

interface IconButtonProps extends IconProps {
  buttonClassName?: string;
  iconClassName?: string;
  iconName:
    | "DownloadSimple"
    | "FilePlus"
    | "NotePencil"
    | "DiscordLogo"
    | "GithubLogo"
    | "X";
}

const IconButton = ({
  buttonClassName,
  iconClassName,
  iconName,
  ...iconProps
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
      case "X":
        return <X {...defaultProps} />;
    }
  };
  return (
    <button
      className={clsx("group p-1.5", buttonClassName)}
      aria-label={iconName}
    >
      {iconSwitch(iconName, iconClassName, iconProps)}
    </button>
  );
};

export default IconButton;
