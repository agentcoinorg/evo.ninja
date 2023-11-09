import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources";
import { ChatMessage } from "../llm";

export class ChatMessageBuilder {
  static system(content: string): ChatMessage {
    return {
      role: "system",
      content,
    };
  }

  static functionCall<TFuncParams>(
    toolId: string,
    funcName: string,
    params: TFuncParams
  ): ChatCompletionAssistantMessageParam {
    if (params === undefined || params === null) {
      params = {} as any;
    }

    return {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: toolId,
          type: "function",
          function: {
            name: funcName,
            arguments:
              typeof params === "string" ? params : JSON.stringify(params),
          },
        },
      ],
    };
  }

  static functionCallResult(
    result: string,
    toolId: string
  ): ChatCompletionToolMessageParam {
    return {
      tool_call_id: toolId,
      role: "tool",
      content: result
    };
  }
}
