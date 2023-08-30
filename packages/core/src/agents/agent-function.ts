import { Result, ResultErr, ResultOk } from "@polywrap/result";
import {
  FUNCTION_NOT_FOUND,
  UNDEFINED_FUNCTION_ARGS,
  UNDEFINED_FUNCTION_NAME,
  UNPARSABLE_FUNCTION_ARGS,
} from "./prompts";
import { Workspace, Logger } from "../sys";
import { Scripts } from "../Scripts";
import { WrapClient } from "../wrap";
import { LlmApi, Chat } from "../llm";
import JSON5 from "json5";

export interface AgentContext {
  globals: Record<string, string>;
  client: WrapClient;
  workspace: Workspace;
  scripts: Scripts;
  llm: LlmApi;
  chat: Chat;
  logger: Logger;
}

export type AgentFunctionResult = Result<string, any>; 

export interface AgentChatMessage {
  type: "success" | "error" | "info" | "warning",
  title: string,
  content: string,
}

export interface AgentFunction {
  definition: any;
  buildChatMessage(args: any, result: AgentFunctionResult): AgentChatMessage;
  buildExecutor(
    context: AgentContext
  ): (options: any) => Promise<any>;
}

export type ExecuteAgentFunction = (
  name: string | undefined,
  args: string | undefined,
  context: AgentContext,
  agentFunctions: AgentFunction[],
) => Promise<Result<AgentChatMessage, string>>;

export const executeAgentFunction: ExecuteAgentFunction = async (
  name: string | undefined,
  args: string | undefined,
  context: AgentContext,
  agentFunctions: AgentFunction[],
): Promise<Result<AgentChatMessage, string>> => {
  const parseResult = processFunctionAndArgs(name, args, agentFunctions);

  if (!parseResult.ok) {
    return ResultErr(parseResult.error);
  }

  const [fnArgs, func] = parseResult.value;

  const executor = func.buildExecutor(context);

  const result = await executor(fnArgs);

  return ResultOk(func.buildChatMessage(fnArgs, result));
}

function processFunctionAndArgs(
  name: string | undefined,
  args: string | undefined,
  agentFunctions: AgentFunction[],
): Result<[any, AgentFunction], string> {
  if (!name) {
    return ResultErr(UNDEFINED_FUNCTION_NAME);
  }

  const func = agentFunctions.find((f) => f.definition.name === name);
  if (!func) {
    return ResultErr(FUNCTION_NOT_FOUND(name));
  }

  if (!args) {
    return ResultErr(UNDEFINED_FUNCTION_ARGS(name));
  }

  let fnArgs;
  try {
    fnArgs = args
      ? JSON5.parse(args)
      : undefined;
  } catch(err: any) {
    return ResultErr(UNPARSABLE_FUNCTION_ARGS(name, args, err));
  }

  return ResultOk([fnArgs, func]);
}