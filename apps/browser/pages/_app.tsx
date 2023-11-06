import React, { useEffect } from "react";
import type { AppProps } from "next/app";

import '../styles/globals.css'
import '../styles/Landing.css'
import '../styles/Dojo.css'
import '../styles/DojoConfig.css'
import '../styles/File.css'
import '../styles/DojoError.css'
import '../styles/Sidebar.css'
import '../styles/Chat.css'


export default function EvoApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (window) {
      window.Buffer = window.Buffer || require("buffer").Buffer;
    }
  }, []);
  return <Component {...pageProps} />;
}
