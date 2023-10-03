import {
  AgentFunctionResult,
  JsEngine,
  JsEngine_GlobalVar,
  shimCode,
  Scripts,
  WrapClient
} from "@evo-ninja/agent-utils";
import { Result, ResultOk, ResultErr } from "@polywrap/result";

export function createScriptExecutor(
  scripts: Scripts,
  client: WrapClient,
  scriptName: string,
  onSuccess: (params: any) => AgentFunctionResult
) {
  return async (params: any): Promise<Result<AgentFunctionResult, string>> => {
    const script = scripts.getScriptByName(scriptName);

    if (!script) {
      return ResultErr(`Unable to find the script ${scriptName}`);
    }

    const globals: JsEngine_GlobalVar[] = Object.entries(params).map(
      (entry) => ({
        name: entry[0],
        value: JSON.stringify(entry[1])
      })
    );
    const jsEngine = new JsEngine(client);
    const result = await jsEngine.evalWithGlobals({
      src: shimCode(script.code),
      globals
    });

    if (!result.ok) {
      return ResultErr(result.error?.toString());
    }

    return ResultOk(onSuccess(params));
  };
}
