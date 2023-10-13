import { AgentOutputType, trimText, ChatMessageBuilder, AgentFunctionResult, AgentVariables } from "@evo-ninja/agent-utils"
import { ScriptedAgent } from "../scriptedAgents"
import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

interface WriteFileFuncParameters { 
  path: string;
  data: string;
  encoding: string;
};

export class WriteFileFunction extends ScriptFunction<WriteFileFuncParameters> {
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

  onSuccess(scriptedAgent: ScriptedAgent, params: WriteFileFuncParameters, rawParams: string | undefined, result: string, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${scriptedAgent.config.name}] ${this.name}`,
          content: `${params.path}\n` +
            `${params.encoding}\n` +
            `${trimText(params.data, 200)}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResult(this.name, "Successfully wrote file.", variables)
      ]
    }
  }
}