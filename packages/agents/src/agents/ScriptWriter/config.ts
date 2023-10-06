import { AgentBaseConfig, AgentBaseContext } from "../../AgentBase";
import { ThinkFunction } from "../../functions/Think";
import { WriteScriptFunction } from "../../functions/WriteScript";

export interface ScriptWriterRunArgs {
  namespace: string;
  description: string;
  args: string;
}

export interface ScriptWriterContext extends AgentBaseContext {}

const writeScriptFn = new WriteScriptFunction();

const AGENT_NAME = "ScriptWriter";

export const SCRIPTWRITER_AGENT_CONFIG: AgentBaseConfig<ScriptWriterRunArgs, ScriptWriterContext> = {
  name: AGENT_NAME,
  expertise: "writing single-purpose scripts",
  initialMessages: ({
    namespace,
    description,
    args
  }) => [
    {
      role: "assistant",
      content:
`I am an agent designed to write JavaScript functions. 
1. Always think through the implementation step-by-step before coding.
2. Submit your code using the writeScript function.
3. Don't get disheartened by initial failures. Retry until success.
4. Ensure authenticity; avoid creating mock functionality.`
    },
    {
      role: "user", content:
`Your goal is to compose the body of an async JavaScript function.

Details:
- Function namespace: "${namespace}"
- Arguments: ${args}
- Description: "${description}"

Guidelines:
1. Treat function arguments as locally defined variables. You're crafting just the function body.
2. Limit yourself to the provided arguments. Don't introduce new ones.
3. If the function needs to return a value, use the return keyword.
4. For libraries, utilize the require function for imports.
5. Stick to the following libraries: ${WriteScriptFunction.formatSupportedLibraries()}.
6. Avoid using external APIs that mandate authentication or API keys.
7. Refrain from recursive calls to the "${namespace}" function.

Example:
\`\`\`
const fs = require('fs');
return fs.readFileSync(path, encoding);
\`\`\``
    }
  ],
  loopPreventionPrompt: "Assistant, try executing the writeScript.",
  functions: [
    new ThinkFunction(),
    writeScriptFn
  ],
  shouldTerminate: (functionCalled) => functionCalled.name === writeScriptFn.name
}
