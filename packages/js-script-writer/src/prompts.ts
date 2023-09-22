import { trimText } from "@evo-ninja/agent-utils";

export const INITIAL_PROMP = `You are an agent that writes JavaScript functions.\n` +
`Before writing any code think step by step about what you want to implement.\n` +
`Call the writeFunction function to submit the code of your JavaScript function.\n` +
`If the first try doesn't succeed, try again. Do not create mock functionality.\n`;

export const GOAL_PROMPT = (namespace: string, description: string, args: string) => 
  `Your task is to write the body of an async JavaScript function.\nFunction namepace: "${namespace}"\nArguments: ${args}.\nDescription: "${description}"\n` +
  `You must refer to function arguments as if they were locally defined variables, remember you're writing just the body of the function.\n` +
  `Use only the function arguments above, do not add new ones.\n` +
  `Since you are writing the body of the function, remember to use the return keyword if needed.\n` +
  `When using libraries, use the require function to import them.\n` +
  `Do not require libraries aside from 'fs' and 'axios'\n` +
  `Do not use external APIs that require authentication or an API key.\n` + 
  `Example function body:\n` +
  `const fs = require('fs');\n` +
  `return fs.readFileSync(path, encoding);\n`;

export const LOOP_PREVENTION_PROMPT = 
  "Assistant, try executing the writeFunction.";

export const FUNCTION_CALL_FAILED = (name: string, error: string, args: any) =>
  `The function '${name}' failed, this is the error:\n\`\`\`\n${
    error && typeof error === "string"
      ? trimText(error, 300)
      : "Unknown error."
    }\n\`\`\`\n\nArguments:\n\`\`\`\n${JSON.stringify(args, null, 2)}\n\`\`\``;
