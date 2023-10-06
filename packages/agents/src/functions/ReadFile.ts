import { AgentOutputType, trimText, ChatMessageBuilder, AgentFunctionResult } from "@evo-ninja/agent-utils"
import { ScriptedAgent } from "../scriptedAgents"
import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class ReadFileFunction extends ScriptFunction<{
  path: string;
  data: string;
}> {
  get name() {
    return "fs_readFile"
  }

  get description() {
    return "Read data from a file"
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        path: {
          type: "string",
        },
        data: {
          type: "string"
        },
      },
      required: ["path", "data"],
      additionalProperties: false
    }
  }

  onSuccess(scriptedAgent: ScriptedAgent, params: any, result: string): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${scriptedAgent.name}] ${this.name}`,
          content: `${params.path}\n` +
            `${params.encoding}\n` +
            `${trimText(params.data, 200)}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(this.name, result)
      ]
    }
  }
}