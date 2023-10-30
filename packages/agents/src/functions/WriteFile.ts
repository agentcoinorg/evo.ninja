import { AgentOutputType, trimText, ChatMessageBuilder, AgentFunctionResult } from "@/agent-core"
import { ScriptFunction } from "./utils";
import { Agent } from "../agents/utils";

interface WriteFileFuncParameters { 
  path: string;
  data: string;
  encoding: string;
};

export class WriteFileFunction extends ScriptFunction<WriteFileFuncParameters> {
  
  name: string = "fs_writeFile";
  parameters: any = {
    type: "object",
    properties: {
      path: {
        type: "string",
      },
      data: {
        type: "string"
      },
      encoding: {
        type: "string"
      },
    },
    required: ["path", "data", "encoding"],
    additionalProperties: false
  };

  onSuccess(agent: Agent, params: WriteFileFuncParameters, rawParams: string | undefined, result: string): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${agent.config.prompts.name}] ${this.name}`,
          content: `${params.path}\n` +
            `${params.encoding}\n` +
            `${trimText(params.data, 200)}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(this.name, "Successfully wrote file.")
      ]
    }
  }
}