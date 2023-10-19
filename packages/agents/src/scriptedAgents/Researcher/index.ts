import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { DelegateAgentFunction } from "../../functions/DelegateScriptedAgent";
import { WebResearcherAgent } from "../WebResearcher";
import { prompts } from "./prompts";

export class ResearcherAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {

    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );

    const onGoalFailedFn = new OnGoalFailedFunction(
      context.client,
      context.scripts
    );

    const config: ScriptedAgentConfig = {
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        new WriteFileFunction(context.client, context.scripts),
        new ReadFileFunction(context.client, context.scripts),
        new ReadDirectoryFunction(context.client, context.scripts),
        new DelegateAgentFunction(() => new WebResearcherAgent({
          ...context,
          chat: context.chat.cloneEmpty()
        }))
      ],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
          functionCalled.name
        );
      },
      prompts,
    };

    super(config, context);
  }
}
