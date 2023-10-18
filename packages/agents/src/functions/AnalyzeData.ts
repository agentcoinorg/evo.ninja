import { Agent, AgentFunctionResult, ChatLogs, ChatMessageBuilder, LlmApi, Tokenizer } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { AgentBaseContext } from "../AgentBase";

interface AnalyzeDataParameters {
  data: string;
}

export class AnalyzeDataFunction extends AgentFunctionBase<AnalyzeDataParameters> {
  constructor(private _llm: LlmApi, private _tokenizer: Tokenizer) {
    super();
  }

  name: string = "analyzeData";
  description: string = "Analyzes large datasets and returns a comprehensive summary of all details";
  parameters: any = {
    type: "object",
    properties: {
      data: {
        type: "string",
        description: "The datasets to be analyzed"
      }
    },
    required: ["data"],
    additionalProperties: false
  };

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: AnalyzeDataParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: AnalyzeDataParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      const fuzTokens = 200;
      const maxTokens = this._llm.getMaxContextTokens() - fuzTokens;

      const prompt = (summary: string | undefined) => {
        return `Your job is to analyze data. You will summarize the dataset provided in a way that includes all unique details.\n
                ${summary ? `An existing summary exists, please add all new details found to it.\n\`\`\`\n${summary}\n\`\`\`\n` : ``}`;
      }
      const appendData = (prompt: string, chunk: string) => {
        return `${prompt}\nData:\n\`\`\`\n${chunk}\n\`\`\``;
      }

      let summary: string | undefined = undefined;

      const len = params.data.length;
      let idx = 0;

      while (idx < len) {
        const promptStr = prompt(summary);
        const propmtTokens = this._tokenizer.encode(promptStr).length;
        const chunkTokens = (maxTokens - propmtTokens);
        const chunk = params.data.substring(idx, Math.min(idx + chunkTokens, len));
        idx += chunkTokens;

        const promptFinal = appendData(promptStr, chunk);

        const chatLogs = new ChatLogs({
          "persistent": {
            tokens: this._tokenizer.encode(promptFinal).length,
            msgs: [{
              role: "user",
              content: promptFinal
            }]
          },
          "temporary": {
            tokens: 0,
            msgs: []
          }
        });

        const resp = await this._llm.getResponse(chatLogs, undefined);

        summary = resp?.content || "";
      }

      return {
        outputs: [],
        messages: [
          ChatMessageBuilder.functionCall(this.name, rawParams),
          ...ChatMessageBuilder.functionCallResultWithVariables(this.name, summary || "", context.variables)
        ]
      };
    }
  }
}
