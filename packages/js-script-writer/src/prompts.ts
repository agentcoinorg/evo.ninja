import { trimText } from "@evo-ninja/agent-utils";
import { formatSupportedLibraries } from "./agent-functions/writeFunction";

export const INITIAL_PROMPT = `You are an agent designed to write JavaScript functions. 
1. Always think through the implementation step-by-step before coding.
2. Submit your code using the writeFunction function.
3. Don't get disheartened by initial failures. Retry until success.
4. Ensure authenticity; avoid creating mock functionality.`;

export const GOAL_PROMPT = (namespace: string, description: string, args: string) => `
Your goal is to compose the body of an async JavaScript function.

Details:
- Function namespace: "${namespace}"
- Arguments: ${args}
- Description: "${description}"

Guidelines:
1. Treat function arguments as locally defined variables. You're crafting just the function body.
2. Limit yourself to the provided arguments. Don't introduce new ones.
3. If the function needs to return a value, use the return keyword.
4. For libraries, utilize the require function for imports.
5. Stick to the following libraries: ${formatSupportedLibraries()}.
6. Avoid using external APIs that mandate authentication or API keys.
7. Refrain from recursive calls to the "${namespace}" function.

Example:
\`\`\`
const fs = require('fs');
return fs.readFileSync(path, encoding);
\`\`\``;

export const LOOP_PREVENTION_PROMPT = 
  "Assistant, try executing the writeFunction.";

export const FUNCTION_CALL_FAILED = (name: string, error: string, args: any) =>
  `The function '${name}' failed, this is the error:\n\`\`\`\n${
    error && typeof error === "string"
      ? trimText(error, 300)
      : "Unknown error."
    }\n\`\`\`\n\nArguments:\n\`\`\`\n${JSON.stringify(args, null, 2)}\n\`\`\``;
