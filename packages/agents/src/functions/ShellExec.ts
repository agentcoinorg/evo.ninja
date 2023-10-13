// import { AgentOutputType, trimText, ChatMessageBuilder, AgentFunctionResult } from "@evo-ninja/agent-utils"
// import { ScriptedAgent } from "../scriptedAgents"
import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

interface ShellExecFuncParameters {
  args: string[]
}

export class ShellExecFunction extends ScriptFunction<ShellExecFuncParameters> {
  get name() {
    return "cmd_shellExec"
  }

  get description() {
    return "Execute a terminal command"
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        command: {
          type: "string",
        },
        args: {
          type: "array",
          items: {
            type: "string"
          }
        },
      },
      required: ["command", "args"],
      additionalProperties: false
    }
  }

  // onSuccess(scriptedAgent: ScriptedAgent, params: ShellExecFuncParameters, result: string): AgentFunctionResult {
  //   return {
  //     outputs: [
  //       {
  //         type: AgentOutputType.Success,
  //         title: `[${scriptedAgent.config.name}] ${this.name}`,
  //         content: `${trimText(result, 500)}`
  //       }
  //     ],
  //     messages: [
  //       ChatMessageBuilder.functionCall(this.name, params),
  //       ChatMessageBuilder.functionCallResult(this.name, result)
  //     ]
  //   }
  // }
}