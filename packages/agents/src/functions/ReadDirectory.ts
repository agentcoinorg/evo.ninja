import { AgentOutputType, trimText, ChatMessageBuilder, AgentFunctionResult, AgentVariables } from "@evo-ninja/agent-utils"
import { ScriptedAgent } from "../scriptedAgents"
import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

interface ReadDirectoryFuncParameters { 
  path: string;
  encoding: string;
};

export class ReadDirectoryFunction extends ScriptFunction<ReadDirectoryFuncParameters> {
  get name() {
    return "fs_readDirectory"
  }

  get description() {
    return "Reads the contents of the directory"
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        path: {
          type: "string",
        }
      },
      required: ["path"],
      additionalProperties: false
    }
  }

  onSuccess(scriptedAgent: ScriptedAgent, params: ReadDirectoryFuncParameters, rawParams: string | undefined, result: string, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${scriptedAgent.config.name}] ${this.name}`,
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