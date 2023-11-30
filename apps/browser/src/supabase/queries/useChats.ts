import { useQuery } from "@supabase-cache-helpers/postgrest-swr";
import { useSupabase } from "../useSupabase";
import { useSession } from "../useSession";

export const useChats = () => {
  const supabase = useSupabase();
  const { session } = useSession();

  return useQuery(
    supabase
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
      .eq("user_id", session?.user.id) ?? null,
  );
};
