import { ChatMessage } from "../llm";

export class ChatMessageBuilder {
  static system(content: string): ChatMessage {
    return {
      role: "system",
      content,
    };
  }

  static functionCall<TFuncParams>(funcName: string, params: TFuncParams): ChatMessage {
    if (params === undefined || params === null) {
      params = {} as any;
    }

    return {
      role: "assistant",
      content: "",
      function_call: {
        name: funcName,
        arguments: typeof params === "string" ?
          params :
          JSON.stringify(params)
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
}
