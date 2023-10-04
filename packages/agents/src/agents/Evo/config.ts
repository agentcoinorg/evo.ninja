import { Scripts, WrapClient } from "@evo-ninja/agent-utils";
import { AgentBaseConfig, AgentBaseContext } from "../../AgentBase";
import { ON_GOAL_ACHIEVED_FN_NAME, ON_GOAL_FAILED_FN_NAME } from "../..";
import { CREATE_SCRIPT_FN_NAME, createScriptFunction } from "./functions/createScript";
import { EXECUTE_SCRIPT_FN_NAME, executeScriptFunction } from "./functions/executeScript";
import { FIND_SCRIPT_FN_NAME, findScriptFunction } from "./functions/findScript";

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
      role: "user",
      content: `You are an agent that executes scripts to accomplish goals.\n` +
      `You can search for new scripts using the findScript function.\n` +
      `If you can not find a script that matches your needs you can create one with the createScript function.\n` +
      `Some problems can be solved without scripts. Before writing a script, consider whether a script is required. \n` +
      `You can execute scripts using the executeScript function.\n` +
      `When executing scripts use named arguments with TypeScript syntax.\n` +
      `When executing scripts, in the 'result' argument, you can pass a name of a global variable where you want to store the result.\n` +
      `Use the readVar function to read the JSON preview of a global variable.\n` +
      `Ask yourself if you have all the required information to achieve a goal. If you don't, search the web for it\n` +
      `You can use the executeScript function to execute agent.speak script to inform the user of anything noteworthy.\n` +
      `Once you have achieved the goal, use executeScript function to execute agent.onGoalAchieved script.\n` +
      `If you can not achieve the goal, use executeScript function to execute agent.onGoalFailed script.\n` +
      `Remember, always try to first find an existing script before creating one.`
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

  },
  shouldTerminate: (functionCalled) => {
    return [
      ON_GOAL_ACHIEVED_FN_NAME,
      ON_GOAL_FAILED_FN_NAME
    ].includes(functionCalled.name);
  },
}
