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

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: AnalyzeFormattingRequirementsParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: AnalyzeFormattingRequirementsParameters, rawParams?: string): Promise<AgentFunctionResult> => {

      const chatLogs = ChatLogs.from([{
          role: "user",
          content: `Given the following user goal, please identify any formatting requirements:\n\`\`\`\n${params.goal}\n\`\`\``
        }], [], this._tokenizer);

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
