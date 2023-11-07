import React, { useEffect } from "react";
import type { AppProps } from "next/app";
import { Exo } from "next/font/google"

import '../styles/globals.css'
import clsx from "clsx";

const exo = Exo({
  subsets: ["latin"]
})

export default function EvoApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (window) {
      window.Buffer = window.Buffer || require("buffer").Buffer;
    }
  }, []);
  return (
    <div className={clsx(exo.className, "h-full")}>
      <Component {...pageProps} />
    </div>
  )
}
