import clsx from "clsx";
import Script from "next/script";
import { config } from "@fortawesome/fontawesome-svg-core";
import NextAuthProvider from "@/components/providers/NextSessionProvider";
import { EXO_FONT } from "@/lib/fonts";
import { Provider } from "jotai";
import { ToastContainer } from "react-toastify";

import "../styles/globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-toastify/dist/ReactToastify.css";
import AccountConfig from "@/components/AccountConfig";
import ToastProvider from "@/components/providers/ToastProvider";
import WelcomeModal from "@/components/WelcomeModal";
import WorkspaceFilesProvider from "@/components/providers/WorkspaceFilesProvider";
import SidebarLayout from "@/components/SidebarLayout";

config.autoAddCss = false;

export default function EvoApp({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <div className={clsx(EXO_FONT.className, "h-full")}>
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
          <Provider>
            <NextAuthProvider>
              <WorkspaceFilesProvider>
                <ToastProvider>
                  <SidebarLayout>
                    {children}
                  </SidebarLayout>
                  <WelcomeModal />
                  <AccountConfig />
                </ToastProvider>
              </WorkspaceFilesProvider>
            </NextAuthProvider>
          </Provider>
          <ToastContainer />
        </div>
      </body>
    </html>
  );
}
