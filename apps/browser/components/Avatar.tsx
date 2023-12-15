import clsx from "clsx";
import Image from "next/image";

interface AvatarProps {
  size?: number;
  className?: string;
}

const Avatar = ({ size = 20, className }: AvatarProps) => {
  return (
    <Image
      src={"./guest.svg"}
      height={size}
      width={size}
      alt="User Avatar"
      className={clsx("rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
};

export default Avatar;
