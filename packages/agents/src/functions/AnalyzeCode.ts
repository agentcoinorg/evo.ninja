import {
  AgentFunctionResult,
  AgentOutputType,
  ChatMessageBuilder,
  LlmApi,
  TextChunker,
  Tokenizer,
} from "@evo-ninja/agent-utils";
import { LlmAgentFunctionBase } from "../LlmAgentFunctionBase";
import { Agent } from "../Agent";
import { Rag } from "../agents/Chameleon/Rag";

interface AnalyzeCodeFuncParameters {
  query: string;
  context: string;
}

export class AnalyzeCode extends LlmAgentFunctionBase<AnalyzeCodeFuncParameters> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }
  name: string = "analyzeCode";
  description: string = "Plans how to develop software based on user goal";
  parameters: any = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The query to write code for",
      },
      context: {
        type: "string",
        description: "High level information available to achieve the goal",
      },
    },
    required: ["query", "context"],
    additionalProperties: false,
  };
  buildExecutor({ context }: Agent<unknown>) {
    return async (
      params: AnalyzeCodeFuncParameters,
      rawParams?: string | undefined
    ): Promise<AgentFunctionResult> => {
      const files = context.workspace.readdirSync("./");
      const textFiles = files.filter((f) => f.name.endsWith(".txt"));
      let informationAvailable;

      if (textFiles.length) {
        const content = textFiles.map(({ name }) =>
          context.workspace.readFileSync(name)
        );
        const chunkedContent = content.flatMap((f) =>
          TextChunker.multiLines(f, 4)
        );
        const matches = await Rag.standard(chunkedContent, context)
          .selector((x) => x)
          .query(params.context)
          .then(async (results) => {
            return results;
          });

        console.log("matches received:")
        console.log(matches)
        informationAvailable = matches;
      }

      const pythonFiles = files.filter((f) => f.name.endsWith(".py"));
      let pythonNameFiles;
      if (pythonFiles.length) {
        pythonNameFiles = pythonFiles.map((f) => f.name);
      }

      console.log(params.context);
      const prompt = `
${
  informationAvailable
    ? "Information about goal available:" + informationAvailable.join("\n")
    : ""
}
${
  pythonNameFiles
    ? "Available code files in workspace" + pythonNameFiles.join("\n")
    : ""
}

Goal desired by user: ${params.query}. ${params.context}

Based on the given goal you must create an step by step/iterative plan to fulfill the requested goal. You must plan this with the following points in mind:
- You have resources available which you should interact with and take into account in order to achieve the goal
- Steps must be focused in developing the implementation, then in testing if asked
- It's necessary to define the steps taking into account the dependency of between them
- If there is any step that depends on a file from workspace, you must name the file to interact with
- If there are any tests available, you must run them when you're sure of your final implementation and then iterate accordingly.
- Be as precise and concise as possible
`;
      const planSuggestion = await this.askLlm(prompt);
      console.log(planSuggestion);
      return {
        outputs: [
          {
            type: AgentOutputType.Success,
            title: "",
            content: "",
          },
        ],
        messages: [
          ChatMessageBuilder.functionCall(this.name, rawParams),
          ChatMessageBuilder.functionCallResult(this.name, planSuggestion),
        ],
      };
    };
  }
}
