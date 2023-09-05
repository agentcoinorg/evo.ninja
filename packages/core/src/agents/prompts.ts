import { trimText } from "./utils";

export const UNDEFINED_FUNCTION_NAME =
  "Function call name was undefined.";

export const FUNCTION_NOT_FOUND = (name: string) =>
  `Function ${name} does not exist. Try calling executeScript instead`;

export const UNPARSABLE_FUNCTION_ARGS = (name: string, args: string, err: any) =>
  `Could not parse JSON arguments for function: ${name}. Error: ${err.toString()}\nJSON Arguments: ${args}\nTry using different arguments instead.`;

export const UNDEFINED_FUNCTION_ARGS = (name: string) =>
  `Function call argument for '${name}' were undefined.`;

export const FUNCTION_CALL_FAILED = (name: string, error: string, args: any) =>
  `The function '${name}' failed, this is the error:\n\`\`\`\n${
    error && typeof error === "string"
      ? trimText(error, 300)
      : "Unknown error."
    }\n\`\`\`\n\nArguments:\n\`\`\`\n${JSON.stringify(args, null, 2)}\n\`\`\``;

export const READ_GLOBAL_VAR_OUTPUT = (name: string, value: string) =>
  `## Read Variable\n**'{{${name}}}'**:\n\`\`\`\n${value}\n\`\`\`\n`;

export const EXECUTE_SCRIPT_OUTPUT = (varName: string, result: string) =>
  `## Result\nPreview: \`\`\`\n${trimText(result, 200)}\`\`\`\n\nResult Stored in Variable: \`{{${varName}}}\`\n`;

export const OTHER_EXECUTE_FUNCTION_OUTPUT = (result: string) =>
  `## Result\n\`\`\`\n${result}\n\`\`\``;
