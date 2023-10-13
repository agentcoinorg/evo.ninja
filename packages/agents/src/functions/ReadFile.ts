import { AgentOutputType, trimText, ChatMessageBuilder, AgentFunctionResult, AgentVariables } from "@evo-ninja/agent-utils"
import { ScriptedAgent } from "../scriptedAgents"
import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

interface ReadFileFuncParameters { 
  path: string;
  encoding: string;
};

export class ReadFileFunction extends ScriptFunction<ReadFileFuncParameters> {
  get name() {
    return "fs_readFile"
  }

  get description() {
    return "Reads data from a file."
  }

  get parameters() {
    return {
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
    }
  }

  onSuccess(scriptedAgent: ScriptedAgent, params: ReadFileFuncParameters, rawParams: string | undefined, result: string, variables: AgentVariables): AgentFunctionResult {
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
        ChatMessageBuilder.functionCallResult(this.name, result, variables)
      ]
    }
  }
}