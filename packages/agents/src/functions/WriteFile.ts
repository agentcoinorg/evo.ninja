import { AgentOutputType, trimText, ChatMessageBuilder } from "@evo-ninja/agent-utils"
import { SubAgent } from "../subagents"
import { SubAgentFunctionBase } from "../subagents/SubAgentFunction"
import { HandlerResult } from "../AgentFunctionBase";

export class WriteFileFunction extends SubAgentFunctionBase<{
  path: string;
  data: string;
  encoding: string;
}> {
  get name() {
    return "fs_writeFile"
  }

  get description() {
    return "Writes data to a file, replacing the file if it already exists."
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
        encoding: {
          type: "string"
        },
      },
      required: ["path", "data", "encoding"],
      additionalProperties: false
    }
  }

  onSuccess(subAgent: SubAgent, params: any, result: string): HandlerResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${subAgent.name}] ${this.name}`,
          content: `${params.path}\n` +
            `${params.encoding}\n` +
            `${trimText(params.data, 200)}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(this.name, "Successfully wrote file.")
      ]
    }
  }
}