import { useSupabase } from "../useSupabase";
import { useQuery } from "@supabase-cache-helpers/postgrest-swr";

export const useChats = () => {
  const supabase = useSupabase();
  return useQuery(
    supabase?.client
      .from("chats")
      .select(
        `
      id,
      created_at,
      user_id,
      messages (
        id,
        role,
        content,
        created_at,
        name,
        function_call
      )
    `
      )
      .eq("user_id", supabase.userId) ?? null,
  );
};
