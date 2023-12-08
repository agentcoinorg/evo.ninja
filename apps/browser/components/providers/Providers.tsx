"use client";

import { Provider as JotaiProvider } from "jotai";
import { ToastContainer } from "react-toastify";
import ToastProvider from "@/components/providers/ToastProvider";
import WorkspaceFilesProvider from "@/components/providers/WorkspaceFilesProvider";
import ReactQueryProvider from "./ReactQueryProvider";
import SupabaseProvider from "./SupabaseProvider";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <JotaiProvider>
        <SupabaseProvider>
          <ReactQueryProvider>
            <WorkspaceFilesProvider>
              <ToastProvider>{children}</ToastProvider>
            </WorkspaceFilesProvider>
            <ToastContainer />
          </ReactQueryProvider>
        </SupabaseProvider>
      </JotaiProvider>
    </SessionProvider>
  );
}
