import { AgentOutputType, trimText, ChatMessageBuilder, AgentFunctionResult } from "@/agent-core"
import { ScriptFunction } from "./utils";
import { Agent } from "../agents/utils";
import { Scripts } from "@evo-ninja/agent-utils";

interface ReadFileFuncParameters { 
  path: string;
  encoding: string;
};

export class ReadFileFunction extends ScriptFunction<ReadFileFuncParameters> {
  constructor(scripts: Scripts) {
    super(scripts);
  }

  name: string = "fs_readFile";
  parameters: any = {
    type: "object",
    properties: {
      path: {
        type: "string",
      },
      encoding: {
        type: "string"
      },
    },
    required: ["path", "encoding"],
    additionalProperties: false
  };

  onSuccess(agent: Agent, params: ReadFileFuncParameters, rawParams: string | undefined, result: string): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${agent.config.prompts.name}] ${this.name}`,
          content: `${params.path}\n` +
            `${params.encoding}\n` +
            `${trimText(result, 200)}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(this.name, result)
      ]
    }
  }
}
