import React, { useEffect } from "react";
import type { AppProps } from "next/app";
import { Exo } from "next/font/google";

import "../styles/globals.css";
import clsx from "clsx";
import Script from "next/script";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

config.autoAddCss = false;

export const EXO_FONT = Exo({
  subsets: ["latin"],
});

export default function EvoApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (window) {
      window.Buffer = window.Buffer || require("buffer").Buffer;
    }
  }, []);
  return (
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
      <Component {...pageProps} />
    </div>
  );
}
