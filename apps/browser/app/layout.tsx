import clsx from "clsx";
import { Ubuntu_FONT } from "@/lib/fonts";
import SidebarLayout from "@/components/SidebarLayout";
import { cookies } from "next/headers";

export default function Layout({ children }: { children: React.ReactNode }) {
  const currentDevice = cookies().get("X-User-Device");

  return (
    <div className={clsx(Ubuntu_FONT.className, "h-full")}>
      <SidebarLayout isMobile={!!(currentDevice?.value === "mobile")}>
        {children}
      </SidebarLayout>
    </div>
  );
}
