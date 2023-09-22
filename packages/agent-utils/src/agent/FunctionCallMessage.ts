import { ChatMessage, ChatRole } from "../llm";

export class FunctionCallMessage<TFuncParams> implements ChatMessage {
  role: ChatRole;
  content: string;
  function_call: {
    name: string;
    arguments: string;
  };
  constructor(
    funcName: string, 
    params: TFuncParams, 
    content: string = ""
  ) {
    this.role = "assistant";
    this.content = content;
    this.function_call = {
      name: funcName,
      arguments: JSON.stringify(params)
    };
  }
}
