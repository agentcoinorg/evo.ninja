import {
  AgentFunctionResult,
  ChatMessageBuilder,
  LlmApi,
  Tokenizer,
  CsvChunker,
  Rag,
  AgentContext,
  ArrayRecombiner,
  Prompt
} from "@/agent-core";
import { LlmAgentFunctionBase } from "./utils";
import { Agent } from "../agents/utils";

interface AnalyzeDataParameters {
  data: string;
  question: string;
}

export class AnalyzeDataFunction extends LlmAgentFunctionBase<AnalyzeDataParameters> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }

  name: string = "analyzeData";
  description: string = "Analyzes large datasets and returns a comprehensive summary of all details";
  parameters: any = {
    type: "object",
    properties: {
      data: {
        type: "string",
        description: "The datasets to be analyzed"
      },
      question: {
        type: "string",
        description: "the question your analysis is trying to answer"
      }
    },
    required: ["data", "question"],
    additionalProperties: false
  };

  async analyze(params: AnalyzeDataParameters, context: AgentContext): Promise<string> {
    const chunks = CsvChunker.newlinesWithHeader(
      params.data,
      { chunkLength: 20, overlap: 2 }
    );

    const relevantChunks = await Rag.standard(context)
      .addItems(chunks)
      .query(params.question)
      .recombine(ArrayRecombiner.standard({ 
        limit: 3, 
        sort: "index" 
      }));

    let prompt = new Prompt();

    for (let i = 0; i < relevantChunks.length; ++i) {
      const chunk = relevantChunks[i];
      prompt = prompt.line(`Chunk #${i}`).block(chunk);
    }

    prompt = prompt
      .line(`
        Consider the above chunks of CSV data.
        Detail any column names & data formats used.
        Summarize the semantic meaning of the chunks.
        Tailor your response to the following question:
      `)
      .line(params.question)
      .line("BE VERY TERSE IN YOUR RESPONSE.");

    return await this.askLlm(prompt.toString(), {
      model: "gpt-3.5-turbo-16k",
      maxResponseTokens: 100
    });
  }

  buildExecutor({ context }: Agent<unknown>): (params: AnalyzeDataParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: AnalyzeDataParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      const summary = await this.analyze(params, context);

      return {
        outputs: [],
        messages: [
          ChatMessageBuilder.functionCall(this.name, rawParams),
          ChatMessageBuilder.functionCallResult(this.name, summary)
        ]
      };
    }
  }
}
