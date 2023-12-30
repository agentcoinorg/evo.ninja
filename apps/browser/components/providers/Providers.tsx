"use client";

import { Provider as JotaiProvider } from "jotai";
import ReactQueryProvider from "./ReactQueryProvider";
import ToastProvider from "./ToastProvider";
import SupabaseClientProvider from "@/lib/supabase/SupabaseClientProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseClientProvider>
      <JotaiProvider>
        <ToastProvider>
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </ToastProvider>
      </JotaiProvider>
    </SupabaseClientProvider>
  );
}
