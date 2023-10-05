import {
  FUNCTION_NOT_FOUND,
  UNDEFINED_FUNCTION_ARGS,
  UNDEFINED_FUNCTION_NAME,
  UNPARSABLE_FUNCTION_ARGS,
} from "./prompts";
import { AgentFunction, AgentFunctionResult } from "./AgentFunction";

import { Result, ResultErr, ResultOk } from "@polywrap/result";
import JSON5 from "json5";

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

// export const executeAgentFunction: ExecuteAgentFunction = async <TContext>(
//   func: AgentFunction<TContext>,
//   args: unknown,
//   context: TContext,
// ): Promise<ExecuteAgentFunctionResult> => {

//   const executor = func.buildExecutor(context);
//   const result = await executor(args);

//   return {
//     result,
//     functionCalled: {
//       name: func.definition.name,
//       args
//     },
//   };
// }

export function processFunctionAndArgs<TContext>(
  name: string | undefined,
  args: string | undefined,
  agentFunctions: AgentFunction<TContext>[],
): Result<[unknown, AgentFunction<TContext>], string> {
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
