import "../styles/globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "react-toastify/dist/ReactToastify.css";
import { Providers } from "@/components/providers/Providers";
import Layout from "@/app/layout";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { config } from "@fortawesome/fontawesome-svg-core";
import { AppProps } from 'next/app';
import { Metadata } from "next";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "evo.ninja"
}

export default function App({
  Component,
  pageProps: { session, ...pageProps }
}: AppProps) {
  if (!session) {
    throw Error("session undefined. You must define `getServerSideProps` within all pages.");
  }

  return (
    <>
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
      {/* SessionProvider rendered server-side to reducing session invalidation */}
      <SessionProvider session={session}>
        <Providers>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </Providers>
      </SessionProvider>
    </>
  );
}
