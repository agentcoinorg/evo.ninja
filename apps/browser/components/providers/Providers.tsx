"use client";

import { Provider as JotaiProvider } from "jotai";
import ReactQueryProvider from "./ReactQueryProvider";
import { SessionProvider } from "next-auth/react";
import ToastProvider from "./ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
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
