import { ScriptedAgent, ScriptedAgentConfig, ScriptedAgentContext } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import * as prompts from "./prompts";
import { RunTestPythonAnalyser } from "../../functions/RunTestPythonAnalyser";
import { DeveloperPlanner } from "../../functions/DeveloperPlanner";

const AGENT_NAME = "Developer";

export class DeveloperAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.client, context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.client, context.scripts);
    const writeFileFn = new WriteFileFunction(context.client, context.scripts);
    const readFileFn = new ReadFileFunction(context.client, context.scripts);
    const readDirFn = new ReadDirectoryFunction(context.client, context.scripts);
    const pythonTestAnalyser = new RunTestPythonAnalyser(context.llm, context.chat.tokenizer, context.client);
    const developmentPlanner = new DeveloperPlanner(context.llm, context.chat.tokenizer)

    const config: ScriptedAgentConfig = {
      name: AGENT_NAME,
      expertise: prompts.EXPERTISE,
      initialMessages: prompts.INITIAL_MESSAGES(writeFileFn, readFileFn, developmentPlanner, pythonTestAnalyser),
      loopPreventionPrompt: prompts.LOOP_PREVENTION_PROMPT,
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        writeFileFn,
        readFileFn,
        readDirFn,
        pythonTestAnalyser,
        developmentPlanner
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