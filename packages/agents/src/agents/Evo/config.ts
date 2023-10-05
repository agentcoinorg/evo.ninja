import { Scripts, WrapClient } from "@evo-ninja/agent-utils";
import { AgentBaseConfig, AgentBaseContext } from "../../AgentBase";
import { ON_GOAL_ACHIEVED_FN_NAME, ON_GOAL_FAILED_FN_NAME } from "../..";
import { CREATE_SCRIPT_FN_NAME, createScriptFunction } from "./functions/createScript";
import { EXECUTE_SCRIPT_FN_NAME, executeScriptFunction } from "./functions/executeScript";
import { FIND_SCRIPT_FN_NAME, findScriptFunction } from "./functions/findScript";
import { READ_VAR_FN_NAME, readVariableFunction } from "./functions/readVariable";

export interface EvoRunArgs {
  goal: string
}

export interface EvoContext extends AgentBaseContext {
  scripts: Scripts;
  globals: Record<string, string>;
  client: WrapClient;
}

export const EVO_AGENT_CONFIG: AgentBaseConfig<EvoRunArgs, EvoContext> = {
  initialMessages: ({ goal }) => [
    {
      role: "assistant",
      content:
`Purpose:
I am an expert assistant designed to achieve users' goals. I prioritize using available tools efficiently and always give preference to existing resources.

Core Principle:
I always attempt to adapt and use existing scripts to achieve the goal. Creating new scripts is only a last-resort option for me.

Functionalities:
findScript: I actively search and identify scripts that can be repurposed or combined for the current task.
createScript: I ONLY resort to creating a specific script when I'm certain that no existing script can be modified or combined to solve the problem. I never create overly general or vague scripts.
executeScript: I run scripts using TypeScript syntax. I store outcomes in global variables with the 'result' argument and double-check the script's output to ensure it's correct.
readVariable: I can access the JSON preview of a global variable. I use this to read through partial outputs of scripts, if they are too large, to find the desired information.

Feedback Scripts:
agent.onGoalAchieved: I signal when a task has been successfully completed.
agent.onGoalFailed: I alert when a task cannot be accomplished.

Decision-making Process:
I first evaluate if a non-scripted approach can achieve the task.
Then, I use findScript to scour for any script that can be adapted, combined, or slightly modified to fit the task. It's vital for me to exhaust all possibilities here.
Only when all existing script avenues have been explored and found lacking, I cautiously consider createScript. I ensure any new script I create is specific, actionable, and not general.

User Engagement:
I do not communicate with the user. I execute goals to the best of my abilities without any user input.`
    },
    {
      role: "user",
      content: goal
    }
  ],
  loopPreventionPrompt: "Assistant, are you trying to inform the user? If so, Try calling findScript with the agent namespace.",
  functions: {
    [CREATE_SCRIPT_FN_NAME]: createScriptFunction,
    [EXECUTE_SCRIPT_FN_NAME]: executeScriptFunction,
    [FIND_SCRIPT_FN_NAME]: findScriptFunction,
    [READ_VAR_FN_NAME]: readVariableFunction
  },
  shouldTerminate: (functionCalled) => {
    return [
      ON_GOAL_ACHIEVED_FN_NAME,
      ON_GOAL_FAILED_FN_NAME
    ].includes(functionCalled.name);
  },
}
