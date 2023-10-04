import { Chat, ContextWindow, Env, InMemoryWorkspace, LlmApi, Logger, trimText } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "../ScriptWriter";

export const FUNCTION_CALL_SUCCESS_CONTENT = (fnName: string, params: any, result: string) => 
  `## Function Call:\n` + 
  `\`\`\`javascript\n` + 
  `${fnName}(${JSON.stringify(params, null, 2)})\n` + 
  `\`\`\`\n` +
  `## Result\n` + 
  `\`\`\`\n` + 
  `${result}\n` +
  `\`\`\``;

export const FUNCTION_CALL_FAILED = (params: any, name: string, error: string) =>
  `The function '${name}' failed, this is the error:\n\`\`\`\n${
    error && typeof error === "string"
      ? trimText(error, 300)
      : trimText(JSON.stringify(error, null, 2), 300)
    }\n\`\`\`\n\nArguments:\n\`\`\`\n${JSON.stringify(params, null, 2)}\n\`\`\``;

export const createScriptWriter = (args: {
  llm: LlmApi,
  chat: Chat,
  logger: Logger,
  env: Env
}): ScriptWriter => {
  const workspace = new InMemoryWorkspace();
  const contextWindow = new ContextWindow(args.llm);
  const chat = new Chat(args.chat.tokenizer, contextWindow, args.logger);
  return new ScriptWriter(args.llm, chat, workspace, args.logger, args.env);
};
