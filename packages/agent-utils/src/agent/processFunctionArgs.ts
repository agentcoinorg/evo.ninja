import {
  FUNCTION_NOT_FOUND,
  UNDEFINED_FUNCTION_ARGS,
  UNDEFINED_FUNCTION_NAME,
  UNPARSABLE_FUNCTION_ARGS,
} from "./prompts";
import { AgentFunction, AgentFunctionResult } from "./AgentFunction";
import { AgentVariables } from "./AgentVariables";

import { Result, ResultErr, ResultOk } from "@polywrap/result";
import JSON5 from "json5";

export interface ExecuteAgentFunctionCalled {
  name: string;
  params: any;
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

  // Find the agent function
  const func = agentFunctions.find((f) => f.definition.name === name);
  if (!func) {
    return ResultErr(FUNCTION_NOT_FOUND(name));
  }

  // Error if args are undefined
  if (!args) {
    return ResultErr(UNDEFINED_FUNCTION_ARGS(name));
  }

  try {
    const parsedArgs = args ? JSON5.parse(args) : undefined;

    if (typeof parsedArgs === "object") {
      // For each object entry
      for (const [key, value] of Object.entries(parsedArgs)) {
        // Check if the value is a variable
        if (typeof value === "string" && AgentVariables.hasSyntax(value)) {
          // Replace it in-place with its true value
          parsedArgs[key] = variables.get(value);
        }
      }
    }
    return ResultOk([parsedArgs, func]);
  } catch(err: any) {
    return ResultErr(UNPARSABLE_FUNCTION_ARGS(name, args, err));
  }
}

export const executeAgentFunction = async <TContext>(
  [params, func]: [unknown, AgentFunction<TContext>],
  rawParams: string | undefined,
  context: TContext
): Promise<ExecuteAgentFunctionResult> => {
  const executor = func.buildExecutor(context);
  return {
    result: await executor(params, rawParams),
    functionCalled: {
      name: func.definition.name,
      params: rawParams,
    },
  };
};
