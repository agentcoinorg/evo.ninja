import {
  FUNCTION_NOT_FOUND,
  UNDEFINED_FUNCTION_ARGS,
  UNDEFINED_FUNCTION_NAME,
  UNPARSABLE_FUNCTION_ARGS,
} from "./prompts";

import { Result, ResultErr, ResultOk } from "@polywrap/result";
import { ChatCompletionFunctions } from "openai";
import JSON5 from "json5";
import { AgentMessage } from "./messages";

export type AgentFunctionDefinition = ChatCompletionFunctions;

export type AgentFunctionResult = Result<AgentMessage[], string>; 

export interface AgentFunction<TContext> {
  definition: AgentFunctionDefinition;
  buildExecutor(
    context: TContext
  ): (options: any) => Promise<AgentFunctionResult>;
}

export interface ExecuteAgentFunctionCalled {
  name: string;
  args: any;
}

export interface ExecuteAgentFunctionResult {
  functionCalled?: ExecuteAgentFunctionCalled;
  result: Result<AgentMessage[], string>;
}

export type ExecuteAgentFunction = <TContext>(
  name: string | undefined,
  args: string | undefined,
  context: TContext,
  agentFunctions: AgentFunction<TContext>[],
) => Promise<ExecuteAgentFunctionResult>;

export const executeAgentFunction: ExecuteAgentFunction = async <TContext>(
  name: string | undefined,
  args: string | undefined,
  context: TContext,
  agentFunctions: AgentFunction<TContext>[],
): Promise<ExecuteAgentFunctionResult> => {
  const parseResult = processFunctionAndArgs(name, args, agentFunctions);

  if (!parseResult.ok) {
    return {
      result: ResultErr(parseResult.error)
    };
  }

  const [fnArgs, func] = parseResult.value;

  const executor = func.buildExecutor(context);
  const result = await executor(fnArgs);

  return {
    result,
    functionCalled: {
      name: func.definition.name,
      args: fnArgs
    },
  };
}

function processFunctionAndArgs<TContext>(
  name: string | undefined,
  args: string | undefined,
  agentFunctions: AgentFunction<TContext>[],
): Result<[any, AgentFunction<TContext>], string> {
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