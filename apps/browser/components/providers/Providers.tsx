"use client";
import { Provider as JotaiProvider } from "jotai";
import { ToastContainer } from "react-toastify";
import ToastProvider from "@/components/providers/ToastProvider";
import WorkspaceFilesProvider from "@/components/providers/WorkspaceFilesProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <WorkspaceFilesProvider>
        <ToastProvider>{children}</ToastProvider>
      </WorkspaceFilesProvider>
      <ToastContainer />
    </JotaiProvider>
  );
}
