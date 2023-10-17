import { ScriptedAgent, ScriptedAgentConfig, ScriptedAgentContext } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
// import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { prompts } from "./prompts";
import { RunAndAnalysePythonTestFunction } from "../../functions/RunAndAnalysePythonTest";
import { DevelopmentPlanner } from "../../functions/DevelopmentPlanner";
import { SummarizeDirectoryFunction } from "../../functions/SummarizeDirectory";
import { OpenAI } from "@evo-ninja/agent-utils";
export class DeveloperAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const fastLlm = new OpenAI(context.env.OPENAI_API_KEY, "gpt-3.5-turbo-16k-0613", 16000, 2000, context.logger)

    const onGoalAchievedFn = new OnGoalAchievedFunction(context.client, context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.client, context.scripts);
    const writeFileFn = new WriteFileFunction(context.client, context.scripts);
    const readFileFn = new ReadFileFunction(context.client, context.scripts);
    // const readDirectoryFn = new ReadDirectoryFunction(context.client, context.scripts);
    const pythonTestAnalyserFn = new RunAndAnalysePythonTestFunction();
    const developmentPlannerFn = new DevelopmentPlanner(context.llm, context.chat.tokenizer);
    const summarizeDirectoryFn = new SummarizeDirectoryFunction(fastLlm, context.chat.tokenizer);

    const config: ScriptedAgentConfig = {
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        writeFileFn,
        readFileFn,
        pythonTestAnalyserFn,
        developmentPlannerFn,
        summarizeDirectoryFn
      ],
      shouldTerminate: (functionCalled) => {
        return [
          onGoalAchievedFn.name,
          onGoalFailedFn.name
        ].includes(functionCalled.name);
      },
      prompts: prompts(onGoalAchievedFn, onGoalFailedFn, developmentPlannerFn, summarizeDirectoryFn)
    };

    super(config, context);
  }
}