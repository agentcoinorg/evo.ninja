import clsx from "clsx";
import Script from "next/script";
import { config } from "@fortawesome/fontawesome-svg-core";
import { Ubuntu_FONT } from "@/lib/fonts";

import "../styles/globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-toastify/dist/ReactToastify.css";
import SidebarLayout from "@/components/SidebarLayout";
import { Providers } from "@/components/providers/Providers";
import { cookies } from "next/headers";
config.autoAddCss = false;

export default function EvoApp({ children }: { children: React.ReactNode }) {
  const currentDevice = cookies().get("X-User-Device");
  return (
    <html>
      <body>
        <div className={clsx(Ubuntu_FONT.className, "h-full")}>
          <Script
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
          />

          <Script strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
          <Providers>
            <SidebarLayout isMobile={!!(currentDevice?.value === "mobile")}>
              {children}
            </SidebarLayout>
          </Providers>
        </div>
      </body>
    </html>
  );
}
