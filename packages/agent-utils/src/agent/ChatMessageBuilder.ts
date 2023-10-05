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

  static functionCallResult(funcName: string, result?: string): ChatMessage {
    return {
      role: "function",
      name: funcName,
      content: result || "undefined"
    };
  }
}
