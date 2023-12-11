import { EvoSupabaseClient } from "../supabase/EvoSupabaseClient";
import { createSupabaseClient } from "./createSupabaseClient";

import { useSession } from "next-auth/react";

export const useSupabaseClient = (): EvoSupabaseClient => {
  const { data: session } = useSession();
  return createSupabaseClient(session?.supabaseAccessToken as string);
};
