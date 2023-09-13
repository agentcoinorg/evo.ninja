import { trimText } from "./utils";

export const UNDEFINED_FUNCTION_NAME =
  "Function call name was undefined.";

export const FUNCTION_NOT_FOUND = (name: string) =>
  `Function ${name} does not exist. Try calling executeScript instead`;

export const UNPARSABLE_FUNCTION_ARGS = (name: string, args: string, err: any) =>
  `Could not parse JSON arguments for function: ${name}. Error: ${err.toString()}\nJSON Arguments:\n\`\`\`\n${args}\n\`\`\`\nTry using different arguments instead.`;

export const UNDEFINED_FUNCTION_ARGS = (name: string) =>
  `Function call argument for '${name}' were undefined.`;

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