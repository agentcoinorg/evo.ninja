import Image from "next/image";
import SidebarSvg from "../../public/sidebar.svg";

export default function SidebarIcon() {
  return (
    <Image src={SidebarSvg} alt="sidebarico" />
  )
}