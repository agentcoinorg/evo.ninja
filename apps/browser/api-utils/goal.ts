import { SupabaseClient } from "./supabase";

export async function isGoalValid(
  goalId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  if (!goalId) {
    return false
  }

  const goal = await supabase
    .from("goals")
    .select()
    .eq("id", goalId)
    .single();

  if (goal.error) {
    console.log("Error fetching prompt: ", goal.error);
    return false;
  }

  if (!goal.data.user_email) {
    console.log("Goal without user is not valid");
    return false;
  }

  return true;
}
