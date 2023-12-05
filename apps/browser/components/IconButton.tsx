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
    const iconDefaultClass = clsx(
      "text-zinc-500 transition-colors ease-in-out group-hover:text-cyan-500",
      iconClassName
    );
    switch (iconName) {
      case "DownloadSimple":
        return <DownloadSimple className={iconDefaultClass} {...iconProps} />;
      case "FilePlus":
        return <FilePlus className={iconDefaultClass} {...iconProps} />;
      case "NotePencil":
        return <NotePencil className={iconDefaultClass} {...iconProps} />;
      case "DiscordLogo":
        return <DiscordLogo className={iconDefaultClass} {...iconProps} />;
      case "GithubLogo":
        return <GithubLogo className={iconDefaultClass} {...iconProps} />;
      case "X":
        return <X className={iconDefaultClass} {...iconProps} />;
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
