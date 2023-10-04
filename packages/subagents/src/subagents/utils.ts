
import { ResultErr, Result, ResultOk } from "@polywrap/result";
import {
  AgentFunctionResult,
  JsEngine,
  JsEngine_GlobalVar,
  shimCode
} from "@evo-ninja/agent-utils";
import { SubAgentContext } from "./SubAgent";

interface CreateScriptExecutorArgs<TAgentContext> {
  context: TAgentContext
  scriptName: string;
  onSuccess: (params: any) => AgentFunctionResult;
}

export const createScriptExecutor = <TAgentContext extends SubAgentContext = SubAgentContext>(
  args: CreateScriptExecutorArgs<TAgentContext>
) => {
  return async (params: any): Promise<Result<AgentFunctionResult, string>> => {
    const script = args.context.scripts.getScriptByName(args.scriptName);

    if (!script) {
      return ResultErr(`Unable to find the script ${name}`);
    }

    const globals: JsEngine_GlobalVar[] = Object.entries(params).map(
      (entry) => ({
        name: entry[0],
        value: JSON.stringify(entry[1])
      })
    );
    const jsEngine = new JsEngine(args.context.client);
    const result = await jsEngine.evalWithGlobals({
      src: shimCode(script.code),
      globals
    });

    if (!result.ok) {
      return ResultErr(result.error?.toString());
    }

    return ResultOk(args.onSuccess(params));
  };
}