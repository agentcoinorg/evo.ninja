import clsx from "clsx";
import makeBlockie from "ethereum-blockies-base64";
import Image from "next/image";

interface AvatarBlockieProps {
  address: string;
  size?: number;
  className?: string;
}

const AvatarBlockie = ({
  address,
  size = 20,
  className,
}: AvatarBlockieProps) => {
  return (
    <Image
      src={makeBlockie(address)}
      height={size}
      width={size}
      alt="User Avatar"
      className={clsx("rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
};

export default AvatarBlockie;
