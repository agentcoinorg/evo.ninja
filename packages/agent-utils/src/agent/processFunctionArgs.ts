import {
  FUNCTION_NOT_FOUND,
  UNDEFINED_FUNCTION_ARGS,
  UNDEFINED_FUNCTION_NAME,
  UNPARSABLE_FUNCTION_ARGS,
} from "./prompts";
import { AgentFunction, AgentFunctionResult } from "./AgentFunction";

import { Result, ResultErr, ResultOk } from "@polywrap/result";
import JSON5 from "json5";
import {AgentVariables} from "./AgentVariables";

export interface ExecuteAgentFunctionCalled {
  name: string;
  args: any;
}

export interface ExecuteAgentFunctionResult {
  functionCalled?: ExecuteAgentFunctionCalled;
  result: AgentFunctionResult;
}

export type ExecuteAgentFunction = <TContext>(
  func: AgentFunction<TContext>,
  args: unknown,
  context: TContext,
  agentFunctions: AgentFunction<TContext>[],
) => Promise<ExecuteAgentFunctionResult>;

export function processFunctionAndArgs<TContext>(
  name: string | undefined,
  args: string | undefined,
  agentFunctions: AgentFunction<TContext>[],
  variables: AgentVariables
): Result<[unknown, AgentFunction<TContext>], string> {
  if (!name) {
    return ResultErr(UNDEFINED_FUNCTION_NAME);
  }

  // This is a common error that's been observed,
  // where the LLM responds with an invalid name
  // starting with "functions."
  if (name.startsWith("functions.")) {
    name = name.replace("functions.", "");
  }

  const func = agentFunctions.find((f) => f.definition.name === name);
  if (!func) {
    return ResultErr(FUNCTION_NOT_FOUND(name));
  }

  if (!args) {
    return ResultErr(UNDEFINED_FUNCTION_ARGS(name));
  }

  let fnArgs = args;
  let i = 0;
  while ((i = fnArgs.indexOf(AgentVariables.Prefix, i)) !== -1) {
    const endIdx = fnArgs.indexOf(AgentVariables.Suffix, i);
    const varWithSyntax = fnArgs.substring(i, endIdx + 1);
    const varContents = variables.get(varWithSyntax);
    if (varContents) {
      fnArgs = fnArgs.replace(varWithSyntax, varContents);
      i += varContents.length;
    }
  }

  try {
    fnArgs = JSON5.parse(fnArgs);
  } catch(err: any) {
    return ResultErr(UNPARSABLE_FUNCTION_ARGS(name, fnArgs, err));
  }

  return ResultOk([fnArgs, func]);
}

export const executeAgentFunction = async <TContext>(
  [args, func]: [unknown, AgentFunction<TContext>],
  rawArgs: string | undefined,
  context: TContext
): Promise<ExecuteAgentFunctionResult> => {
  const executor = func.buildExecutor(context);
  return {
    result: await executor(args, rawArgs),
    functionCalled: {
      name: func.definition.name,
      args,
    },
  };
};
