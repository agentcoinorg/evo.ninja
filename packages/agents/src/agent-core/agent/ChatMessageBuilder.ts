import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionFunctionMessageParam,
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
    funcName: string,
    params: TFuncParams
  ): ChatCompletionAssistantMessageParam {
    if (params === undefined || params === null) {
      params = {} as any;
    }

    return {
      role: "assistant",
      content: "",
      function_call: {
        name: funcName,
        arguments: typeof params === "string" ? params : JSON.stringify(params),
      },
    };
  }

  static functionCallResult(
    funcName: string,
    result: string
  ): ChatCompletionFunctionMessageParam {
    return {
      role: "function",
      name: funcName,
      content: result,
    };
  }

  static toolCall<TFuncParams>(
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

  static toolCallResult(
    toolId: string,
    result: string
  ): ChatCompletionToolMessageParam {
    return {
      tool_call_id: toolId,
      role: "tool",
      content: result,
    };
  }
}
