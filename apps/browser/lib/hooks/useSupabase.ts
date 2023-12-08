import { useAtom } from "jotai";
import { supabaseAtom } from "../store";

export const useSupabase = () => {
  const [supabase] = useAtom(supabaseAtom)

  return supabase
}