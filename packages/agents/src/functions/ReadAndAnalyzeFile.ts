import { AnalyzeDataFunction } from "./AnalyzeData";
import { AgentFunctionBase } from "./utils";
import { Agent } from "../agents/utils";
import { AgentFunctionResult, ChatMessageBuilder } from "@/agent-core";

interface ReadAndAnalyzeFileParameters {
  path: string;
  question: string;
}

export class ReadAndAnalyzeFileFunction extends AgentFunctionBase<ReadAndAnalyzeFileParameters> {
  name: string = "readAndAnalyzeFile";
  description: string = "Read and analyze files to answer questions. Returns a comprehensive summary of all relevant details."
  parameters: any = {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "path to the file"
      },
      question: {
        type: "string",
        description: "the question your analysis is trying to answer"
      }
    },
    required: ["path", "question"],
    additionalProperties: false
  }

  buildExecutor(agent: Agent<unknown>): (params: ReadAndAnalyzeFileParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: ReadAndAnalyzeFileParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      const analyzeData = new AnalyzeDataFunction(agent.context.llm, agent.context.chat.tokenizer);

      const data = agent.context.workspace.readFileSync(params.path);
      const summary = await analyzeData.analyze({ data, question: params.question }, agent.context);
      const variable = await agent.context.variables.save("fileData", data);

      return {
        outputs: [],
        messages: [
          ChatMessageBuilder.functionCall(this.name, params),
          ChatMessageBuilder.functionCallResult(this.name, `File Data Stored in Variable: \${${variable}}\nData Summary:\n\`\`\`\n${summary}\n\`\`\``),
          ChatMessageBuilder.functionCallResult(this.name, `\${${variable}}`)
        ]
      };
    }
  }
}
