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

  static functionCallResult(funcName: string, result: string, variables: AgentVariables): ChatMessage[] {
    if (variables.shouldSave(result)) {
      const varName = variables.save(funcName, result);

      return [
        {
          role: "function",
          name: funcName,
          content: `Due to it's size, the result is stored in variable \${${varName}} (total length: ${result.length}).
To read different parts of the stored variable, use the function readVariable("\${${varName}}", start, count)`
        },
        ChatMessageBuilder.functionCall("readVariable", { name: varName, start: 0, count: variables.saveThreshold}),
        {
          role: "function",
          name: "readVariable",
          content: readGlobalVarMessage(3000, varName, result, 0, variables.saveThreshold)
        }
      ];
    } else {
      return [
        {
          role: "function",
          name: funcName,
          content: result
        },
      ];
    }
  }
}

function readGlobalVarMessage(maxVarLength: number, varName: string, value: string | undefined, start: number, count: number) {
  if (!value || value === "\"undefined\"") {
    return `Variable \${${varName}} is undefined`;
  }
  else {
    let warn = "";
    if (count > maxVarLength) {
      warn = `Warning: maximum read length is ${maxVarLength} bytes, result will be shortened.`;
    }
    const cnt = Math.min(count, maxVarLength);
    const end = Math.min(start + cnt, value.length);
    const val = value.substring(start, end);
    return `${warn}\nReading ${start}-${end} bytes of variable \${${varName}} (length ${value.length}):\n\`\`\`\n${val}...\n\`\`\``;
  } 
}
