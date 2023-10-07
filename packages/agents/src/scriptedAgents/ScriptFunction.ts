import { AgentFunctionResult, AgentOutputType, ChatMessageBuilder, JsEngine, JsEngine_GlobalVar, shimCode } from "@evo-ninja/agent-utils"
import { ScriptedAgent, ScriptedAgentContext } from "./ScriptedAgent"
import { AgentFunctionBase } from "../AgentFunctionBase";

export abstract class ScriptFunction<TParams> extends AgentFunctionBase<ScriptedAgentContext, TParams> {
  onSuccess(scriptedAgent: ScriptedAgent, params: any, result: string): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${scriptedAgent.name}] ${this.name}`,
          content: `${params.query}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(this.name, result)
      ]
    }
  };
  onFailure(scriptedAgent: ScriptedAgent, params: any, error: string): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `[${scriptedAgent.name}] Error in ${this.name}: ${error}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(this.name, `Error: ${error}`)
      ]
    }
  };
  
  buildExecutor(scriptedAgent: ScriptedAgent, context: ScriptedAgentContext): (params: TParams) => Promise<AgentFunctionResult> {
    return async (params: any): Promise<AgentFunctionResult> => {
      const scriptName = this.name.split("_").join(".");
      const script = context.scripts.getScriptByName(scriptName);
  
      if (!script) {
        return this.onFailure(scriptedAgent, params, `Unable to find the script ${scriptName}`);
      }
  
      const globals: JsEngine_GlobalVar[] = Object.entries(params).map(
        (entry) => ({
          name: entry[0],
          value: JSON.stringify(entry[1])
        })
      );
      const jsEngine = new JsEngine(context.client);
      const result = await jsEngine.evalWithGlobals({
        src: shimCode(script.code),
        globals
      });
  
      if (result.ok) {
        if (result.value.error == null) {
          const jsPromiseOutput = context.client.jsPromiseOutput;
          if (jsPromiseOutput.ok) {
            return this.onSuccess(scriptedAgent, params, JSON.stringify(jsPromiseOutput.value));
          } else {
            return this.onFailure(scriptedAgent, params, jsPromiseOutput.error.message);
          }
        } else {
          return this.onFailure(scriptedAgent, params, result.value.error.toString());
        }
      } else {
        return this.onFailure(scriptedAgent, params, result.error?.toString() ?? "Unknown error");
      }
    };
  }
}

