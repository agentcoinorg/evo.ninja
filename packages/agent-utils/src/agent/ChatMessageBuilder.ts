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
        arguments: JSON.stringify(params)
      }
    };
  }

  static functionCallResult(funcName: string, result: string, variables: AgentVariables): ChatMessage {
    if (variables.shouldSave(result)) {
      const varName = variables.save(funcName, result);
      result = `Result stored in variable named \${${varName}}.\nreadVariable("\${${varName}}", 0, ${variables.saveThreshold})\n${
        result.substring(0, variables.saveThreshold)
      }`;
    }

    return {
      role: "function",
      name: funcName,
      content: result
    };
  }
}
