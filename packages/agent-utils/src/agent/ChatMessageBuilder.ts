import { AgentVariables } from "./AgentVariables";
import { ChatMessage } from "../llm";
import { readVariableResultMessage } from "./readVariableResultMessage";

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

  static functionCallResult(funcName: string, result: string): ChatMessage {
    return {
      role: "function",
      name: funcName,
      content: result
    };
  }

  static functionCallResultWithVariables(funcName: string, result: string, variables: AgentVariables, saveThreshold?: number): ChatMessage[] {
    const threshold = saveThreshold || variables.saveThreshold;

    if (variables.shouldSave(result)) {
      const varName = variables.save(funcName, result);

      return [
        ChatMessageBuilder.functionCallResult(funcName, `Due to it's size, the result is stored in variable \${${varName}} (total length: ${result.length}).
To read different parts of the stored variable, use the function readVariable("\${${varName}}", start, count)`),
        ChatMessageBuilder.functionCall("readVariable", { name: `\${${varName}}`, start: 0, count: threshold}),
        ChatMessageBuilder.functionCallResult("readVariable", readVariableResultMessage(varName, result, 0, threshold, threshold)),
      ];
    } else {
      return [
        ChatMessageBuilder.functionCallResult(funcName, result),
      ];
    }
  }
}
