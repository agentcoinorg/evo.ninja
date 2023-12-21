import { ReadDirectoryFunction } from "./ReadDirectory";
import { ReadAndAnalyzeCSVDataFunction } from "./ReadAndAnalyzeCSVData";
import { CsvJoinableColumnsFunction } from "./CsvJoinableColumns";
import { AgentFunctionResult, ChatMessageBuilder } from "@/agent-core";
import { Agent } from "../agents/utils";
import { AgentFunctionBase } from "./utils";

interface UnderstandDataParameters {
  goal: string;
}

export class UnderstandDataFunction extends AgentFunctionBase<UnderstandDataParameters> {
  name: string = "understandData";
  description: string = "Understand the data and the user's goal.";
  parameters: any = {
    type: "object",
    properties: {
      goal: {
        type: "string",
        description: "The user's goal",
      },
    },
    required: ["goal"],
    additionalProperties: false,
  };

  buildExecutor(
    agent: Agent<unknown>
  ): (
    params: UnderstandDataParameters,
    rawParams?: string | undefined
  ) => Promise<AgentFunctionResult> {
    return async (
      params: UnderstandDataParameters,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      const readDirectory = new ReadDirectoryFunction(
        agent.context.scripts
      ).buildExecutor(agent);

      // In parallel:
      // - analyze data formatting requirements
      // - read directory
      // - read and analyze all files
      const results: AgentFunctionResult[] = await Promise.all([
        readDirectory({ path: "./" }),
        ...(await this.readAndAnalyzeFiles(agent, params.goal)),
      ]);

      return {
        outputs: results.flatMap((x) => x.outputs),
        messages: [
          ChatMessageBuilder.functionCall(this.name, params),
          ChatMessageBuilder.functionCallResult(
            this.name,
            "Understanding data..."
          ),
          ...results.flatMap((x) => x.messages),
        ],
      };
    };
  }

  async readAndAnalyzeFiles(
    agent: Agent<unknown>,
    goal: string
  ): Promise<AgentFunctionResult[]> {
    const workspace = agent.context.workspace;
    const files = (await workspace.readdir("./")).filter(
      (x) => x.type === "file"
    );

    const readAndAnalyzeCSVData =
      new ReadAndAnalyzeCSVDataFunction().buildExecutor(agent);

    const analyzes = await Promise.all(
      files.map((file) =>
        readAndAnalyzeCSVData({
          path: file.name,
          question: goal,
        })
      )
    );

    const csvFiles = files.filter((x) => x.name.endsWith(".csv"));
    const csvJoinableColumns = new CsvJoinableColumnsFunction(
      agent.context.scripts
    ).buildExecutor(agent);
    const calls = [];

    // Generate all combinations of pairs of csv files
    for (let i = 0; i < csvFiles.length; i++) {
      for (let j = i + 1; j < csvFiles.length; j++) {
        // Permutations of the pair
        const csvI = csvFiles[i].name;
        const csvJ = csvFiles[j].name;
        calls.push(await csvJoinableColumns({ csv1: csvI, csv2: csvJ }));
      }
    }

    return [...analyzes, ...calls];
  }
}
