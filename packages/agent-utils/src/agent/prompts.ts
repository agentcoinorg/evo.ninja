export const UNDEFINED_FUNCTION_NAME =
  "Function call name was undefined.";

export const FUNCTION_NOT_FOUND = (name: string) =>
  `Function ${name} does not exist. Only use the functions you have been provided with`;

export const UNPARSABLE_FUNCTION_ARGS = (name: string, args: string, err: any) =>
  `Could not parse JSON arguments for function: ${name}. Error: ${err.toString()}\nJSON Arguments:\n\`\`\`\n${args}\n\`\`\`\nTry using different arguments instead.`;

export const UNDEFINED_FUNCTION_ARGS = (name: string) =>
  `Function call argument for '${name}' were undefined.`;

export const UNKNOWN_VARIABLE_NAME = (variable: string) =>
  `The variable named ${variable} does not exist.`;

export const AGENT_SPEAK_RESPONSE =
  "If you think you've achieved the goal, call agent_onGoalAchieved.\nIf you think you've failed, call agent_onGoalFailed.";
