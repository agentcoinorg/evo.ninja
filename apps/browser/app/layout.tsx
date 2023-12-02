import "../styles/globals.css";
import clsx from "clsx";
import Script from "next/script";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import NextAuthProvider from "@/components/NextSessionProvider";
import { EXO_FONT } from "@/lib/fonts";
import { ReactQueryProvider } from "@/components/ReactQueryProvider";
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
          <ReactQueryProvider>
            <NextAuthProvider>
              {children}
            </NextAuthProvider>
          </ReactQueryProvider>
        </div>
      </body>
    </html>
  );
}
