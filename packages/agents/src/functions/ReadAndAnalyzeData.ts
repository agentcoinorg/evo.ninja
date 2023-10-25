import { AnalyzeDataFunction } from "./AnalyzeData";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { Agent } from "../Agent";
import { AgentFunctionResult, ChatMessageBuilder } from "@evo-ninja/agent-utils";

interface ReadAndAnalyzeDataParameters {
  path: string;
  question: string;
}

export class ReadAndAnalyzeDataFunction extends AgentFunctionBase<ReadAndAnalyzeDataParameters> {
  name: string = "readAndAnalyzeCSVData";
  description: string = "Read and analyze CSV datasets to answer questions. Returns a comprehensive summary of all relevant details."
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

  buildExecutor(agent: Agent<unknown>): (params: ReadAndAnalyzeDataParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: ReadAndAnalyzeDataParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      const analyzeData = new AnalyzeDataFunction(agent.context.llm, agent.context.chat.tokenizer);

      const data = agent.context.workspace.readFileSync(params.path);
      const summary = await analyzeData.analyze({ data, question: params.question }, agent.context);
      const variable = agent.context.variables.save("dataFile", data);

      return {
        outputs: [],
        messages: [
          ChatMessageBuilder.functionCall(this.name, rawParams),
          ChatMessageBuilder.functionCallResult(this.name, `Data File Stored in Variable: \${${variable}}\nData Summary:\n\`\`\`\n${summary}\n\`\`\``)
        ]
      };
    }
  }
}
