import { AgentOutputType, trimText, ChatMessageBuilder, AgentFunctionResult, AgentVariables } from "@evo-ninja/agent-utils"
import { ScriptFunction } from "../scriptedAgents/ScriptFunction"
import { Agent } from "../Agent";

interface UpdateFileFuncParameters {
  path: string;
  content: string;
  startLn: number;
  endLn?: number;
}

export class UpdateFileFunction extends ScriptFunction<UpdateFileFuncParameters> {
  get name() {
    return "fs_updateFile"
  }

  get description() {
    return "Removes the text between [startLn, endLn) in a file and inserts new content at startLn. endLn defaults to the length of the document (in lines). Line numbers are 0-indexed."
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        path: {
          type: "string",
        },
        content: {
          type: "string"
        },
        startLn: {
          type: "number"
        },
        endLn: {
          type: "number"
        }
      },
      required: ["path", "content", "startLn"],
      additionalProperties: false
    }
  }

  onSuccess(agent: Agent<unknown>, params: UpdateFileFuncParameters, rawParams: string | undefined, result: string, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${agent.config.prompts.name}] ${this.name}`,
          content: `File: ${params.path}\n` +
            `Removed lines: [${params.startLn}, ${params.endLn})\n` +
            `Inserted: ${trimText(params.content, 200)}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(this.name, "Successfully updated file.", variables)
      ]
    }
  }
}