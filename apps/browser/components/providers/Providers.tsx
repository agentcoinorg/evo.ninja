"use client";

import { Provider as JotaiProvider } from "jotai";
import WorkspaceFilesProvider from "@/components/providers/WorkspaceFilesProvider";
import ReactQueryProvider from "./ReactQueryProvider";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <JotaiProvider>
        <ReactQueryProvider>
          <WorkspaceFilesProvider>
            {children}
          </WorkspaceFilesProvider>
        </ReactQueryProvider>
      </JotaiProvider>
    </SessionProvider>
  );
}
