import { AgentFunctionResult, ChatMessageBuilder, LlmApi, Tokenizer } from "@/agent-core";
import { LlmAgentFunctionBase } from "./utils";
import { Agent } from "../agents/utils";

interface AnalyzeSoftwareRequirementsParameters {
  goal: string;
}

export class AnalyzeSoftwareRequirementsFunction extends LlmAgentFunctionBase<AnalyzeSoftwareRequirementsParameters> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }

  name: string = "analyzeSoftwareRequirements";
  description: string = "Analyzes the software requirements of a user defined goal";
  parameters: any = {
    type: "object",
    properties: {
      goal: {
        type: "string",
        description: "The user's goal"
      }
    },
    required: ["goal"],
    additionalProperties: false
  };

  buildExecutor({ context }: Agent<unknown>): (toolId: string, params: AnalyzeSoftwareRequirementsParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (toolId: string, params: AnalyzeSoftwareRequirementsParameters, rawParams?: string): Promise<AgentFunctionResult> => {

      const resp = await this.askLlm(`Given the following user goal, please identify any software requirements:\n\`\`\`\n${params.goal}\n\`\`\``);

      return {
        outputs: [],
        messages: [
          ChatMessageBuilder.functionCall(toolId, this.name, rawParams),
          ChatMessageBuilder.functionCallResult(this.name, resp)
        ]
      };
    }
  }
}
