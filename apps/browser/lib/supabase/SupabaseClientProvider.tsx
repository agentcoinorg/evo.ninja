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
    if (!session?.supabaseAccessToken) {
      setSupabaseClient(undefined);
      setLastAccessToken(undefined)
      return;
    }

    if (lastAccessToken === session.supabaseAccessToken) {
      return;
    }
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
