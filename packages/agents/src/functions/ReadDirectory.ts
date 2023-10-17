import { AgentOutputType, trimText, ChatMessageBuilder, AgentFunctionResult, AgentVariables } from "@evo-ninja/agent-utils"
import { ScriptedAgent } from "../scriptedAgents"
import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

interface ReadDirectoryFuncParameters { 
  path: string;
  encoding: string;
};

export class ReadDirectoryFunction extends ScriptFunction<ReadDirectoryFuncParameters> {

  name: string = "fs_readDirectory";
  description: string = "Reads the contents of the directory";
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

  onSuccess(scriptedAgent: ScriptedAgent, params: ReadDirectoryFuncParameters, rawParams: string | undefined, result: string, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${scriptedAgent.config.prompts.name}] ${this.name}`,
          content: `${params.path}\n` +
            `${params.encoding}\n` +
            `${trimText(result, 200)}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(this.name, result, variables)
      ]
    }
  }
}