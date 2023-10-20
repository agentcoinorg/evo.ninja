import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { DelegateAgentFunction } from "../../functions/DelegateScriptedAgent";
import { AgentBaseContext } from "../../AgentBase";
import { AgentWithGoal } from "../../AgentWithGoal";
import { WebResearcherAgent } from "../WebResearcher";
import { ScriptedAgentRunArgs } from "../ScriptedAgent";
import { prompts } from "./prompts";

export class ResearcherAgent extends AgentWithGoal<ScriptedAgentRunArgs> {
  constructor(context: AgentBaseContext) {

    super(
      () => prompts,
      [
        new WriteFileFunction(context.scripts),
        new ReadFileFunction(context.scripts),
        new ReadDirectoryFunction(context.scripts),
        new DelegateAgentFunction(
          () => new WebResearcherAgent(context.cloneEmpty()),
          context.llm,
          context.chat.tokenizer
        ),
      ],
      context
    );
  }
}
