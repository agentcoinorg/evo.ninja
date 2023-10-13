import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";

export class ResearchVerifierAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const AGENT_NAME = "ResearchVerifier";

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
      expertise:
        "excels at evaluating research results",
      initialMessages: ({ goal }) => [
        {
          role: "user",
          content: `
          You are a Research Results Verifier agent tasked with verifying the results of a research query and making sure they fully satisfy the query.

          You will go through the following steps:
          
          1. You will check the original query and make sure that the results are relevant and sufficient to the query.
            If a part of the data is missing, you will consider the result incomplete and communicate what's missing exactly.
            If the information is irrelevant you will communicate why.

          2. Be very critical, don't assume that the user is correct if he says that the results are correct or complete, or fully provided.
          
          3. Always provide reasoning, and then use the ${onGoalAchievedFn.name} function to send the verification results back to the user
          `
        },
        { role: "user", content: goal },
      ],
      loopPreventionPrompt:
        "Assistant, you appear to be in a loop, try executing a different function.",
      functions: [
        onGoalAchievedFn,
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
