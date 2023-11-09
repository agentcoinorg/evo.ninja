import { AgentFunctionResult, ChatMessageBuilder, LlmApi, Tokenizer } from "@/agent-core";
import { LlmAgentFunctionBase } from "./utils";
import { Agent } from "../agents/utils";

interface AnalyzeFormattingRequirementsParameters {
  goal: string;
}

export class AnalyzeFormattingRequirementsFunction extends LlmAgentFunctionBase<AnalyzeFormattingRequirementsParameters> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }

  name: string = "analyzeFormattingRequirements";
  description: string = "Analyzes the requirements of a user defined goal";
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

  buildExecutor({ context }: Agent<unknown>): (toolId: string, params: AnalyzeFormattingRequirementsParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (toolId: string, params: AnalyzeFormattingRequirementsParameters, rawParams?: string): Promise<AgentFunctionResult> => {

      const resp = await this.askLlm(`Given the following user goal, please identify any formatting requirements:\n\`\`\`\n${params.goal}\n\`\`\``);
      
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
