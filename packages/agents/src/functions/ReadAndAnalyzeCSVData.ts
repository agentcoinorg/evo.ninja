import { AnalyzeDataFunction } from "./AnalyzeData";
import { AgentFunctionBase } from "./utils";
import { Agent } from "../agents/utils";
import { AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@/agent-core";

interface ReadAndAnalyzeCSVDataParameters {
  path: string;
  question: string;
}

export class ReadAndAnalyzeCSVDataFunction extends AgentFunctionBase<ReadAndAnalyzeCSVDataParameters> {
  name: string = "readAndAnalyzeCSVData";
  description: string = "Read and analyze CSV datasets to answer questions. Returns a comprehensive summary of all relevant details. Only use on CSV files"
  parameters: any = {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "path to the data file"
      },
      question: {
        type: "string",
        description: "the question your analysis is trying to answer"
      }
    },
    required: ["path", "question"],
    additionalProperties: false
  }

  buildExecutor(agent: Agent<unknown>): (params: ReadAndAnalyzeCSVDataParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: ReadAndAnalyzeCSVDataParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      const analyzeData = new AnalyzeDataFunction(agent.context.llm, agent.context.chat.tokenizer);

      const data = agent.context.workspace.readFileSync(params.path);
      const summary = await analyzeData.analyze({ data, question: params.question }, agent.context);
      const variable = await agent.context.variables.save("dataFile", data);

      return {
        outputs: [
          {
            type: AgentOutputType.Success,
            title: `[${agent.config.prompts.name}] ${this.name}`,
            content: `Data File Stored in Variable: \${${variable}}\nData Summary:\n\`\`\`\n${summary}\n\`\`\``
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(this.name, params),
          ChatMessageBuilder.functionCallResult(this.name, `\${${variable}}`),
          ChatMessageBuilder.functionCallResult(this.name, `Data File Stored in Variable: \${${variable}}\nData Summary:\n\`\`\`\n${summary}\n\`\`\``),
        ]
      };
    }
  }
}
