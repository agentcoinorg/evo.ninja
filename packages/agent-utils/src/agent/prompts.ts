export const UNDEFINED_FUNCTION_NAME =
  "Function call name was undefined.";

export const FUNCTION_NOT_FOUND = (name: string) =>
  `Function ${name} does not exist. Try calling executeScript instead`;

export const UNPARSABLE_FUNCTION_ARGS = (name: string, args: string, err: any) =>
  `Could not parse JSON arguments for function: ${name}. Error: ${err.toString()}\nJSON Arguments: ${args}\nTry using different arguments instead.`;

export const UNDEFINED_FUNCTION_ARGS = (name: string) =>
  `Function call argument for '${name}' were undefined.`;
