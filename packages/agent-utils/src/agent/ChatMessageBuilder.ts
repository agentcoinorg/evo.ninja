import { AgentVariables } from "./AgentVariables";
import { ChatMessage } from "../llm";

export class ChatMessageBuilder {
  static system(content: string): ChatMessage {
    return {
      role: "system",
      content,
    };
  }

  static functionCall<TFuncParams>(funcName: string, params: TFuncParams): ChatMessage {
    return {
      role: "assistant",
      content: "",
      function_call: {
        name: funcName,
        arguments: typeof params === "string" ? params : JSON.stringify(params)
      }
    };
  }

  static functionCallResult(funcName: string, result: string, variables: AgentVariables, saveThreshold?: number): ChatMessage {
    const threshold = saveThreshold || variables.saveThreshold;

    if (variables.shouldSave(result, threshold)) {
      const varName = variables.save(funcName, result);
      result = `Result is too large, stored in variable named \${${varName}}.\nResult Preview readVariable("\${${varName}}", 0, ${threshold}):\n${
        result.substring(0, threshold)
      }...${result.length - threshold} more bytes...`;
    }

    return {
      role: "function",
      name: funcName,
      content: result
    };
  }
}
