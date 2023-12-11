import { Database } from "./dbTypes";

import { SupabaseClient } from "@supabase/supabase-js";

export type EvoSupabaseClient = SupabaseClient<
  Database,
  "public",
  Database["public"]
>;
