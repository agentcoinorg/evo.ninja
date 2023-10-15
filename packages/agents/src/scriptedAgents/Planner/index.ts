import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import * as prompts from "./prompts";

const AGENT_NAME = "Planner";

export class PlannerAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );

    const config: ScriptedAgentConfig = {
      name: AGENT_NAME,
      expertise: prompts.EXPERTISE,
      initialMessages: prompts.INITIAL_MESSAGES(AGENT_NAME, onGoalAchievedFn),
      loopPreventionPrompt: prompts.LOOP_PREVENTION_PROMPT,
      functions: [onGoalAchievedFn],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name].includes(functionCalled.name);
      },
    };

    super(config, context);
  }
}
