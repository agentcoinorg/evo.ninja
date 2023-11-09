import { ReadDirectoryFunction } from "./ReadDirectory";
import { ReadAndAnalyzeFileFunction } from "./ReadAndAnalyzeFile";
import { AnalyzeSoftwareRequirementsFunction } from "./AnalyzeSoftwareRequirements";
import { PlanSoftwareRoadmapFunction } from "./PlanSoftwareRoadmap";
import { AgentFunctionBase } from "./utils";
import { Agent } from "../agents/utils";
import { AgentFunctionResult, ChatMessageBuilder } from "@/agent-core";

interface PlanDevelopmentParameters {
  goal: string;
}

export class PlanDevelopmentFunction extends AgentFunctionBase<PlanDevelopmentParameters> {
  name: string = "planDevelopment";
  description: string = "Plan software development tasks to achieve a user goal"
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
  }

  buildExecutor(agent: Agent<unknown>): (toolId: string, params: PlanDevelopmentParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (toolId: string, params: PlanDevelopmentParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      const readDirectory = new ReadDirectoryFunction(
        agent.context.scripts
      ).buildExecutor(agent);
      const analyzeRequirements = new AnalyzeSoftwareRequirementsFunction(
        agent.context.llm,
        agent.context.chat.tokenizer
      ).buildExecutor(agent);
      const planRoadmap = new PlanSoftwareRoadmapFunction(
        agent.context.llm,
        agent.context.chat.tokenizer
      ).buildExecutor(agent);

      // In parallel:
      // - plan
      //   - analyze requirements
      //   - create high-level roadmap
      // - understand
      //   - read directory
      //   - read and analyze all files
      const plan = Promise.all([
        analyzeRequirements(toolId, { goal: params.goal }),
        planRoadmap(toolId, { goal: params.goal })
      ]);
      const understand: AgentFunctionResult[] = await Promise.all([
        readDirectory(toolId, { path: "./" }),
        ...this.readAndAnalyzeFiles(agent, params.goal, toolId),
      ]);
      const results = [
        ...(await plan),
        ...(await understand)
      ];

      return {
        outputs: results.flatMap((x) => x.outputs),
        messages: [
          ChatMessageBuilder.functionCall(toolId, this.name, params),
          ChatMessageBuilder.functionCallResult(this.name, "Understanding data..."),
          ...results.flatMap((x) => x.messages)
        ]
      };
    }
  }

  readAndAnalyzeFiles(agent: Agent<unknown>, goal: string, toolId: string): Promise<AgentFunctionResult>[] {
    const workspace = agent.context.workspace;
    const files = workspace.readdirSync("./")
      .filter((x) => x.type === "file");

    const readAndAnalyzeFile = new ReadAndAnalyzeFileFunction().buildExecutor(agent);

    const analyzes = files.map((file) => readAndAnalyzeFile(toolId, {
      path: file.name,
      question: goal
    }));

    return [
      ...analyzes
    ];
  }
}
