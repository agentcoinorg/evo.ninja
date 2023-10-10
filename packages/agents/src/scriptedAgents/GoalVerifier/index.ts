import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ReadFileFunction } from "../../functions/ReadFile";
import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";

export class GoalVerifierAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const AGENT_NAME = "GoalVerifier";

    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );

    const onGoalFailedFn = new OnGoalFailedFunction(
      context.client,
      context.scripts
    );

    const config: ScriptedAgentConfig = {
      name: AGENT_NAME,
      expertise: "verifies if the users' goal has been achieved or not.",
      initialMessages: ({ goal, initialMessages }) => [
        { role: "user", content: `\`\`\`
    ${(initialMessages ?? []).map(x => JSON.stringify(x, null, 2 )).join("\n")}
    Verify that the assistant has correctly achieved the users' goal by reading the files.
    Take extra care when reviewing the formatting and constraints of the goal, both defined and implied.
    Trust only what's inside of the files and not the chat messages.`
        },
      ],
      loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
      functions:
        [
          onGoalAchievedFn,
          onGoalFailedFn,
          new ReadFileFunction(context.client, context.scripts),
          new ReadDirectoryFunction(context.client, context.scripts),
      ],
      shouldTerminate: (functionCalled) => {
        return [
          onGoalAchievedFn.name,
          onGoalFailedFn.name
        ].includes(functionCalled.name);
      },
    };

    super(config, context);
  }
}
