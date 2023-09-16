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
      : "Unknown error."
    }\n\`\`\`\n\nArguments:\n\`\`\`\n${JSON.stringify(args, null, 2)}\n\`\`\``;

export const READ_GLOBAL_VAR_OUTPUT = (name: string, value: string) =>
  `## Read Variable\n**'{{${name}}}'**:\n\`\`\`\n${value}\n\`\`\`\n`;

export const EXECUTE_SCRIPT_OUTPUT = (varName: string, result: string) =>
  `## Result\nPreview:\n\`\`\`\n${trimText(result, 200)}\n\`\`\`\n\nResult Stored in Variable: \`{{${varName}}}\`\n`;

export const OTHER_EXECUTE_FUNCTION_OUTPUT = (result: string) =>
  `## Result\n\`\`\`\n${result}\n\`\`\``;
