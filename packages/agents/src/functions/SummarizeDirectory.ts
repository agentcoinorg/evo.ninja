import { AgentFunctionResult, ChatMessageBuilder, LlmApi, Tokenizer } from "@/agent-core";
import { DirectoryChunker } from "@/agent-core";
import { Agent } from "../agents/utils";
import { LlmAgentFunctionBase } from "./utils";

interface SummarizeDirectoryParameters {
  subDirectory?: string;
}

export class SummarizeDirectoryFunction extends LlmAgentFunctionBase<SummarizeDirectoryParameters> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }

  name: string = "summarizeDirectory";
  description: string = `Summarize the contents of a directory. Includes file names and brief descriptions.`;
  parameters: any = {
    type: "object",
    properties: {
      subDirectory: {
        type: "string",
        description: "sub-directory to be summarized (default: root directory)"
      }
    },
    required: [],
    additionalProperties: false
  };

  buildExecutor({ context }: Agent<unknown>): (params: SummarizeDirectoryParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: SummarizeDirectoryParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      const prompt = (summary: string | undefined, chunk: string) =>
        `Your job is to summarize the contents of the following files. In this summary please structure your response on a per-file basis. NOTE: some files have been chunked, line numbers are annotated.\n
        ${summary ? `An existing summary already exists, you MUST modify this to contain all new details, WITHOUT LOOSING INFORMATION already present within the summary.\n\`\`\`${summary}\`\`\`\n`: ""}
        Chunk:\n\`\`\`\n${chunk}\n\`\`\`\n`;

      const fuzTokens = 200;
      const maxInputTokens = this.llm.getMaxContextTokens() - (this.llm.getMaxResponseTokens() + fuzTokens);
      const chunker = new DirectoryChunker({ maxChunkSize: maxInputTokens })
      const chunks = chunker.chunk({
        workspace: context.workspace,
        directory: params.subDirectory
      });

      let summary: string | undefined = undefined;

      for (const chunk of chunks) {
        summary = await this.askLlm(prompt(summary, chunk));
      }

      return {
        outputs: [],
        messages: [
          ChatMessageBuilder.functionCall(this.name, rawParams),
          ChatMessageBuilder.functionCallResult(this.name, summary || "")
        ]
      };
    }
  }
}
