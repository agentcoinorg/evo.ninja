import { EvoSupabaseClient } from "./EvoSupabaseClient";
import { createSupabaseClient } from "./createSupabaseClient";

import { useSession } from "next-auth/react";
import { createContext, useEffect, useRef, useState } from "react";
import React from "react";

export const SupabaseClientContext = createContext<EvoSupabaseClient | undefined>(undefined);

const SupabaseClientProvider = ({ children }: { children: React.ReactNode}) => {
  const { data: session } = useSession();
  const [supabaseClient, setSupabaseClient] = useState<EvoSupabaseClient | undefined>(undefined);
  const [lastAccessToken, setLastAccessToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    console.log("useEffect")
    if (!session?.supabaseAccessToken) {
      console.log("useEffect reset")
      setSupabaseClient(undefined);
      setLastAccessToken(undefined)
      return;
    }

    if (lastAccessToken === session.supabaseAccessToken) {
      console.log("useEffect early out")
      return;
    }
    console.log("useEffect SETTTING")
    console.log("last", lastAccessToken)
    console.log("new", session.supabaseAccessToken)
    setSupabaseClient(createSupabaseClient(session.supabaseAccessToken));
    setLastAccessToken(session.supabaseAccessToken);
  }, [session?.supabaseAccessToken]);

  return (
    <SupabaseClientContext.Provider value={supabaseClient}>
      {children}
    </SupabaseClientContext.Provider>
  );
};
export default SupabaseClientProvider
