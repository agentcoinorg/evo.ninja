import { AgentOutputType, trimText, ChatMessageBuilder, AgentFunctionResult } from "@evo-ninja/agent-utils"
import { ScriptFunction } from "../scriptedAgents/ScriptFunction"
import { Agent } from "../agents/utils";

interface ReadDirectoryFuncParameters { 
  path: string;
};

export class ReadDirectoryFunction extends ScriptFunction<ReadDirectoryFuncParameters> {

  name: string = "fs_readDirectory";
  parameters: any = {
    type: "object",
    properties: {
      path: {
        type: "string",
      }
    },
    required: ["path"],
    additionalProperties: false
  };

  onSuccess(agent: Agent, params: ReadDirectoryFuncParameters, rawParams: string | undefined, result: string): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${agent.config.prompts.name}] ${this.name}`,
          content: `${params.path}\n` +
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