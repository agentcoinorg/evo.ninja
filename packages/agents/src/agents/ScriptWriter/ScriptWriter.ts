import {
  LlmApi,
  Chat,
  Workspace,
  Env,
  agentPlugin,
  WrapClient,
  Logger,
} from "@evo-ninja/agent-utils";
import { AgentBase, AgentBaseConfig, AgentBaseContext } from "../../AgentBase";
import { WriteScriptFunction } from "../../functions/WriteScript";
import { ThinkFunction } from "../../functions/Think";

export interface ScriptWriterRunArgs {
  namespace: string;
  description: string;
  args: string;
}

export class ScriptWriter extends AgentBase<
  ScriptWriterRunArgs,
  AgentBaseContext
> {
  constructor(
    llm: LlmApi,
    chat: Chat,
    workspace: Workspace,
    logger: Logger,
    env: Env
  ) {
    const agentContext = {
      llm: llm,
      chat: chat,
      logger,
      workspace: workspace,
      client: new WrapClient(
        workspace,
        logger,
        agentPlugin({ logger: logger }),
        env
      ),
      variables: {},
      env,
    };

    const writeScriptFn = new WriteScriptFunction();

    const AGENT_NAME = "ScriptWriter";

    const config: AgentBaseConfig<ScriptWriterRunArgs> = {
      name: AGENT_NAME,
      expertise: "writing single-purpose scripts",
      initialMessages: ({ namespace, description, args }) => [
        {
          role: "user",
          content: `You are an agent designed to write JavaScript functions. 
1. Always think through the implementation step-by-step before coding.
2. Submit your code using the writeScript function.
3. Don't get disheartened by initial failures. Retry until success.
4. Ensure authenticity; avoid creating mock functionality.`,
        },
        {
          role: "user",
          content: `Your goal is to compose the body of an async JavaScript function.

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
\`\`\``,
        },
      ],
      loopPreventionPrompt: "Assistant, try executing the writeScript.",
      functions: [new ThinkFunction(), writeScriptFn],
      shouldTerminate: (functionCalled) =>
        functionCalled.name === writeScriptFn.name,
    };

    super(config, agentContext);
  }
}
