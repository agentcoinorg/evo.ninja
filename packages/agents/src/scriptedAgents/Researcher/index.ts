import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { FuzzySearchFunction } from "../../functions/FuzzySearch";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ScrapeTextFunction } from "../../functions/ScrapeText";
import { SearchFunction } from "../../functions/Search";
import * as prompts from "./prompts";

const AGENT_NAME = "Researcher";

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
      name: AGENT_NAME,
      expertise: prompts.EXPERTISE,
      initialMessages: prompts.INITIAL_MESSAGES,
      loopPreventionPrompt: prompts.LOOP_PREVENTION_PROMPT,
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        new SearchFunction(context.client, context.scripts),
        new WriteFileFunction(context.client, context.scripts),
        new ReadFileFunction(context.client, context.scripts),
        new ReadDirectoryFunction(context.client, context.scripts),
        new FuzzySearchFunction(context.client, context.scripts),
        new ScrapeTextFunction(context.client, context.scripts),
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
