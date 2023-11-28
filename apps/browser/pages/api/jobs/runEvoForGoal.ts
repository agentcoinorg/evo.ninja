import { Evo } from "@evo-ninja/agents";
import { buildEvo } from "./buildEvo";

export async function runEvoForGoal(goal: string) {
  console.log(`Running Evo for goal: '${goal}'`);

  const evo: Evo = buildEvo();

  const iterator = evo.run({ goal });

  while (true) {
    const { done, value } = await iterator.next();
    if (done) {
      break;
    }
    console.log(JSON.stringify(value, null, 2));
  }

  console.log(`Goal achieved successfully: '${goal}'`);
}
