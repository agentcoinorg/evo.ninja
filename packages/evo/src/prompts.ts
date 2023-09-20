import { trimText } from "@evo-ninja/agent-utils";

export const INITIAL_PROMP = `You are an agent that executes scripts to accomplish goals.\n` +
`You can search for new scripts using the findScript function.\n` +
`If you can not find a script that matches your needs you can create one with the createScript function.\n` +
`You can execute scripts using the executeScript function.\n` +
`When executing scripts use named arguments with TypeScript syntax.\n` +
`You can use the executeScript function to execute agent.speak script to inform the user of anything noteworthy.\n` +
`Once you have achieved the goal, use executeScript function to execute agent.onGoalAchieved script.\n` +
`If you can not achieve the goal, use executeScript function to execute agent.onGoalFailed script.\n`;
`Remember, always try to first find an existing script before creating one.\n`;

export const GOAL_PROMPT = (goal: string) => `The user has the following goal: ${goal}.`
export const LOOP_PREVENTION_PROMPT = "Assistant, are you trying to inform the user? If so, Try calling findScript with the agent namespace.";

export const FUNCTION_CALL_FAILED = (name: string, error: string, args: any) =>
  `The function '${name}' failed, this is the error:\n\`\`\`\n${
    error && typeof error === "string"
      ? trimText(error, 300)
      : trimText(JSON.stringify(error, null, 2), 300)
    }\n\`\`\`\n\nArguments:\n\`\`\`\n${JSON.stringify(args, null, 2)}\n\`\`\``;

export const READ_GLOBAL_VAR_OUTPUT = (varName: string, value: string | undefined) => {
  if (!value || value === "\"undefined\"") {
    return `## Variable {{${varName}}} is undefined`;
  } else if (value.length > 200) {
    return `## Read variable {{${varName}}}, but it is too large, JSON preview:\n\`\`\`\n${trimText(value, 200)}\n\`\`\``;
  } else {
    return `## Read variable {{${varName}}}, JSON:\n\`\`\`\n${value}\n\`\`\``;
  }
};

export const EXECUTE_SCRIPT_OUTPUT = (varName: string | undefined, result: string | undefined) => {
  if (!result || result === "\"undefined\"") {
    return `## No result returned`;
  } else if (result.length > 200) {
    return `## Preview of JSON result:\n\`\`\`\n${trimText(result, 200)}\n\`\`\`\n${STORED_RESULT_IN_VAR(varName)}`;
  } else {
    return `## JSON result: \n\`\`\`\n${result}\n\`\`\`\n${STORED_RESULT_IN_VAR(varName)}`;
  }
};

const STORED_RESULT_IN_VAR = (varName: string | undefined) => {
  if (varName && varName.length > 0) {
    return `Result stored in variable: {{${varName}}}`;
  } else {
    return "";
  }
}

export const OTHER_EXECUTE_FUNCTION_OUTPUT = (result: string) =>
  `## Result\n\`\`\`\n${result}\n\`\`\``;

export const AGENT_PLUGIN_SPEAK_RESPONSE =
  "User has been informed! If you think you've achieved the goal, execute onGoalAchieved.\nIf you think you've failed, execute onGoalFailed.";
