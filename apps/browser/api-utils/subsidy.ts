import { SupabaseClient } from "./supabase";

type Subsidy = "completions" | "embedding";

const SUBSIDY_CAP: Record<Subsidy, number> = {
  "completions": 50,
  "embedding": 1000
};

export async function canUseSubsidy(
  subsidy: Subsidy,
  goalId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const goal = await supabase
    .from("goals")
    .select()
    .eq("id", goalId)
    .single();

  if (!goal.data.subsidized) {
    console.error(`Goal is not subsidized.`);
    return false;
  }

  const subsidizedProp = subsidy === "completions" ?
    "subsidized_completion_req" :
    "subsidized_embedding_req";

  const subsidizedCount = goal.data[subsidizedProp];

  if (subsidizedCount > SUBSIDY_CAP[subsidy]) {
    console.error(`Subsity limit reached for '${subsidy}'`);
    return false;
  }

  const updateSubsidized = await supabase
    .from("goals")
    .update({ [subsidizedProp]: subsidizedCount + 1 })
    .eq("id", goal.data.id);

  if (updateSubsidized.error) {
    console.error(`Error updating ${subsidizedProp}: `, updateSubsidized.error);
    return false;
  }

  return true;
}
