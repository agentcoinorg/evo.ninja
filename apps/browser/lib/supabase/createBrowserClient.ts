import { Database } from "./dbTypes";
import { createBrowserClient } from "@supabase/ssr";

export const createSupabaseBrowserClient = () => {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return client;
};
