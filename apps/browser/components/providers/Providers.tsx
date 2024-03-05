"use client";

import { Provider as JotaiProvider } from "jotai";
import ReactQueryProvider from "./ReactQueryProvider";
import { SessionProvider } from "next-auth/react";
import ToastProvider from "./ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Re-fetch session every 15 minutes
      refetchInterval={15 * 60}
      // Don't re-fetch session when window is focused
      refetchOnWindowFocus={false}
    >
      <JotaiProvider>
        <ToastProvider>
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </ToastProvider>
      </JotaiProvider>
    </SessionProvider>
  );
}
