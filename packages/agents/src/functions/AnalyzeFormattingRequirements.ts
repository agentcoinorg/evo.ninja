import { Agent, AgentFunctionResult, ChatLogs, ChatMessageBuilder, LlmApi, Tokenizer } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { AgentBaseContext } from "../AgentBase";

interface AnalyzeFormattingRequirementsParameters {
  goal: string;
}

export class AnalyzeFormattingRequirementsFunction extends AgentFunctionBase<AnalyzeFormattingRequirementsParameters> {
  constructor(private _llm: LlmApi, private _tokenizer: Tokenizer) {
    super();
  }

  get name(): string {
    return "analyzeFormattingRequirements";
  }

  get description(): string {
    return "Analyzes the requirements of a user defined goal";
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        goal: {
          type: "string",
          description: "The user's goal"
        }
      },
      required: ["goal"],
      additionalProperties: false
    }
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: AnalyzeFormattingRequirementsParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: AnalyzeFormattingRequirementsParameters, rawParams?: string): Promise<AgentFunctionResult> => {

      const prompt = `Given the following user goal, please identify any formatting requirements:\n\`\`\`\n${params.goal}\n\`\`\``;

      const chatLogs = new ChatLogs({
        "persistent": {
          tokens: this._tokenizer.encode(prompt).length,
          msgs: [{
            role: "user",
            content: prompt
          }]
        },
        "temporary": {
          tokens: 0,
          msgs: []
        }
      });

      const resp = await this._llm.getResponse(chatLogs, undefined);

      return {
        outputs: [],
        messages: [
          ChatMessageBuilder.functionCall(this.name, rawParams),
          ...ChatMessageBuilder.functionCallResultWithVariables(this.name, resp?.content || "", context.variables)
        ]
      };
    }
  }
}
