import { AgentFunctionResult, ChatMessageBuilder, LlmApi, Tokenizer } from "@/agent-core";
import { LlmAgentFunctionBase } from "./utils";
import { Agent } from "../agents/utils";

interface PlanSoftwareRoadmapParameters {
  goal: string;
}

export class PlanSoftwareRoadmapFunction extends LlmAgentFunctionBase<PlanSoftwareRoadmapParameters> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }

  name: string = "planSoftwareRoadmap";
  description: string = "Plan the development roadmap for achieving a user defined goal";
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

  buildExecutor({ context }: Agent<unknown>): (params: PlanSoftwareRoadmapParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: PlanSoftwareRoadmapParameters, rawParams?: string): Promise<AgentFunctionResult> => {

      const resp = await this.askLlm(`Given the following user goal, please create a software development roadmap:\n\`\`\`\n${params.goal}\n\`\`\``);

      return {
        outputs: [],
        messages: [
          ChatMessageBuilder.functionCall(this.name, rawParams),
          ChatMessageBuilder.functionCallResult(this.name, resp)
        ]
      };
    }
  }
}
