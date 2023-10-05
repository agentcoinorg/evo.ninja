import { AgentFunctionResult, AgentOutputType, ChatMessageBuilder, JsEngine, JsEngine_GlobalVar, shimCode } from "@evo-ninja/agent-utils"
import { SubAgent, SubAgentContext } from "./SubAgent"
import { ChatCompletionRequestMessage } from "openai";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { Result, ResultErr, ResultOk } from "@polywrap/result";

export interface HandlerResult {
  outputs: {
    type: AgentOutputType;
    title: string;
    content?: string;
  }[];
  messages: ChatCompletionRequestMessage[];
}

export abstract class SubAgentFunctionBase<TParams> extends AgentFunctionBase<SubAgentContext, TParams> {
  onSuccess(subAgent: SubAgent, params: any, result: string): HandlerResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${subAgent.name}] ${this.name}`,
          content: `${params.query}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(this.name, result)
      ]
    }
  };
  onFailure(subAgent: SubAgent, params: any, error: string): HandlerResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `[${subAgent.name}] Error in ${this.name}: ${error}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(this.name, `Error: ${error}`)
      ]
    }
  };
  
  buildExecutor(subAgent: SubAgent, context: SubAgentContext): (params: TParams) => Promise<Result<AgentFunctionResult, string>> {
    return async (params: any): Promise<Result<AgentFunctionResult, string>> => {
      const scriptName = this.name.split("_").join(".");
      const script = context.scripts.getScriptByName(scriptName);
  
      if (!script) {
        return ResultErr(`Unable to find the script ${scriptName}`);
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
            return ResultOk(
              this.onSuccess(subAgent, params, JSON.stringify(jsPromiseOutput.value))
            );
          } else {
            return ResultOk(this.onFailure(subAgent, params, jsPromiseOutput.error.toString()));
          }
        } else {
          return ResultOk(this.onFailure(subAgent, params, result.value.error.toString()));
        }
      } else {
        return ResultOk(this.onFailure(subAgent, params, result.error?.toString() ?? "Unknown error"));
      }
    };
  }
}

