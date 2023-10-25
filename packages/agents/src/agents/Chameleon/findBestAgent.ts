import { FunctionDefinition } from "@evo-ninja/agent-utils";
import { Agent, GoalRunArgs } from "../../Agent";
import { AgentContext } from "../../AgentContext";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { DeveloperAgent, ResearcherAgent, DataAnalystAgent } from "../../scriptedAgents";
import { Rag } from "./Rag";
import { StandardRagBuilder } from "./StandardRagBuilder";

type AgentWithPrompts = {
  expertise: string;
  persona: string;
  agent: Agent<GoalRunArgs>;
};
let agentRag: StandardRagBuilder<AgentWithPrompts>;

export const findBestAgent = async (
  query: string,
  context: AgentContext,
): Promise<[
  Agent<unknown>,
  FunctionDefinition[],
  string,
  AgentFunctionBase<unknown>[]
]> => {
  const allAgents: Agent[] = [
    DeveloperAgent,
    DataAnalystAgent,
    ResearcherAgent,
  ].map(agentClass => new agentClass(context.cloneEmpty()));

  const agentsWithPrompts = allAgents.map(agent => {
    return {
      expertise: agent.config.prompts.expertise + "\n" + agent.config.functions.map(x => x.name).join("\n"),
      persona: agent.config.prompts.initialMessages({ goal: "" })[0].content ?? "",
      agent,
    };
  });

  if (!agentRag) {
    agentRag = Rag.standard<AgentWithPrompts>(context)
      .addItems(agentsWithPrompts)
      .selector(x => x.expertise)
      .limit(1)
      .onlyUnique();
  }

  const agents = await agentRag.query(query);

  console.log("Selected agents: ", agents.map(x => x.agent.config.prompts.name));

  const agentWithPrompt = agents[0];

  return [
    agentWithPrompt.agent,
    agentWithPrompt.agent.config.functions.map(f => f.getDefinition()),
    agentWithPrompt.persona,
    agentsWithPrompts.map(x => x.agent.config.functions).flat()
  ];
};
