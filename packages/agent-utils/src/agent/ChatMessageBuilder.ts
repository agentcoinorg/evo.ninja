import { ChatMessage } from "../llm";

export class ChatMessageBuilder {
  static system(content: string): ChatMessage {
    return {
      role: "system",
      content,
    };
  }

  static functionCall<TFuncParams>(funcName: string, params: TFuncParams, content: string = ""): ChatMessage {
    return {
      role: "assistant",
      content,
      function_call: {
        name: funcName,
        arguments: JSON.stringify(params)
      }
    };
  }

  static functionCallResponse(funcName: string, content: string): ChatMessage {
    return {
      role: "function",
      content,
      name: funcName
    }
  }
}
