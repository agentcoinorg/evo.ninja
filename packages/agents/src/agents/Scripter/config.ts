import { AgentBaseConfig, ScriptedAgentContext } from "../..";
import { ReadVariableFunction } from "./functions/ReadVariable";
import { FindScriptFunction } from "./functions/FindScript";
import { ExecuteScriptFunction } from "./functions/ExecuteScript";
import { CreateScriptFunction } from "./functions/CreateScript";
import { OnGoalAchievedFunction } from "../../scriptedAgents/functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../scriptedAgents/functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";

export interface ScripterRunArgs {
  goal: string
}

export interface ScripterContext extends ScriptedAgentContext {
  globals: Record<string, string>;
}

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalFailedFunction();

const AGENT_NAME = "Scripter";

export const SCRIPTER_AGENT_CONFIG: AgentBaseConfig<ScripterRunArgs, ScripterContext> = {
  name: AGENT_NAME,
  expertise: "executing and creating scripts to solve basic tasks",
  constraintMessages: () => [
    {
      role: "user",
      content:
`Purpose:
You are an expert assistant designed to achieve goals through the use of scripts. You prioritize the use of existing scripts, and only create new scripts as a last-resort.

Functionalities:
findScript: Search and identify scripts that can be repurposed or combined for the current task.
executeScript: Run scripts using TypeScript syntax. You store outcomes in global variables with the 'variable' argument and double-check the script's output to ensure it's correct.
readVariable: Access the JSON preview of a global variable. You use this to read through partial outputs of scripts, if they are too large, to find the desired information.
createScript: You ONLY resort to creating a specific script when you are certain that no existing script can be modified or combined to solve the problem. You never create overly general or vague scripts.

Decision-making Process:
You first evaluate the goal and see if it can be achieved without using scripts.
Then you use findScript to search for any script that fits the task. It's vital to exhaust all possibilities here.
When suitable scripts are found, you run them to solve the problem.
If no scripts have been found, you cautiously consider createScript. You ensure any new script you create is specific, actionable, and not general.
If a goal has been achieved or failed, you will call the agent_onGoalAchieved or agent_onGoalFailed function.`
    },
  ],
  persistentMessages: ({ goal }) => [
    {
      role: "user",
      content: goal
    }
  ],
  loopPreventionPrompt: "Assistant, you seem to be looping. Try calling findScript, or exiting by calling agent_onGoalAchieved or agent_onGoalFailed.",
  functions: [
    new CreateScriptFunction(),
    new ExecuteScriptFunction(),
    new FindScriptFunction(),
    new ReadVariableFunction(),
    new ReadFileFunction(),
    new WriteFileFunction(),
    new ReadDirectoryFunction(),
    onGoalAchievedFn,
    onGoalFailedFn,
  ],
  shouldTerminate: (functionCalled) => {
    return [
      onGoalAchievedFn.name,
      onGoalFailedFn.name
    ].includes(functionCalled.name);
  },
};
