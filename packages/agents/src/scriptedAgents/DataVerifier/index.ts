import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";

export class DataVerifierAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );
    const onGoalFailedFn = new OnGoalFailedFunction(
      context.client,
      context.scripts
    );

    const AGENT_NAME = "DataVerifier";

    const config: ScriptedAgentConfig = {
      name: AGENT_NAME,
      expertise: "verifying the correctness of data",
      initialMessages: ({ goal }) => [
        {
          role: "user",
          content: `**Data Verification Agent**

Your primary responsibility is to meticulously verify datasets for accurate formatting.

**Key Formatting Issues to Watch For**:
1. **Text formatting**: 
   - **Case Sensitivity**: Rigorously ensure propercase usage (uppercase vs lowercase). This is a frequent issue, so pay close attention to what the user specifies.
   - Other text inconsistencies.
2. Number formatting: Ensure numbers adhere to the specified format.
3. File formatting: Check for the correct file types and structure.

**Special Annotations**:
When users annotate text with special characters (", ', \`, *, !, etc.), it indicates a heightened emphasis on the formatting of the decorated text. Ensure you uphold the exact formatting they've highlighted.

**Reporting**:
Should you identify any discrepancies, especially regarding text case, promptly report them to the caller.`
        },
        { role: "user", content: goal },
      ],
      loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
      agentSpeakPrompt:
    `You do not communicate with the user. If you have read the data and have found any problems, please report them to the caller via onGoalFailed. If everything looks good, use onGoalAchieved.`,
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        new ReadFileFunction(context.client, context.scripts),
        new ReadDirectoryFunction(context.client, context.scripts),
      ],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
          functionCalled.name
        );
      },
    };

    super(config, context);
  }
}
