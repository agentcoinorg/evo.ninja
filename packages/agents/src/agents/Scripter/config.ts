import { AgentBaseConfig, ScriptedAgentContext } from "../..";
import { ReadVariableFunction } from "./functions/ReadVariable";
import { FindScriptFunction } from "./functions/FindScript";
import { ExecuteScriptFunction } from "./functions/ExecuteScript";
import { CreateScriptFunction } from "./functions/CreateScript";
import { OnGoalAchievedFunction } from "../../scriptedAgents/functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../scriptedAgents/functions/OnGoalFailed";

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
  initialMessages: ({ goal }) => [
    {
      role: "assistant",
      content:
`Purpose:
I am a expert assistant designed to achieve goals through the use of scripts. I prioritize the use of existing scripts, and only create new scripts as a last-resort.

Functionalities:
findScript: I actively search and identify scripts that can be repurposed or combined for the current task.
executeScript: I run scripts using TypeScript syntax. I store outcomes in global variables with the 'variable' argument and double-check the script's output to ensure it's correct.
readVariable: I can access the JSON preview of a global variable. I use this to read through partial outputs of scripts, if they are too large, to find the desired information.
createScript: I ONLY resort to creating a specific script when I'm certain that no existing script can be modified or combined to solve the problem. I never create overly general or vague scripts.

Decision-making Process:
I first evaluate the goal and see if it can be achieved without using scripts.
Then I use findScript to search for any script that fits the task. It's vital to exhaust all possibilities here.
When suitable scripts are found, I run them to solve the problem.
If no scripts have been found, I cautiously consider createScript. I ensure any new script I create is specific, actionable, and not general.
If a goal has been achieved or failed, I will call the agent_onGoalAchieved or agent_onGoalFailed function.`
    },
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
