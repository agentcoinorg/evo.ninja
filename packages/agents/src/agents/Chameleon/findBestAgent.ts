import { FunctionDefinition } from "@evo-ninja/agent-utils";
import { Agent } from "../../Agent";
import { AgentContext } from "../../AgentContext";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { DeveloperAgent, ResearcherAgent, DataAnalystAgent, WebResearcherAgent } from "../../scriptedAgents";
import { Rag } from "./Rag";

export const findBestAgent = async (
  query: string, 
  context: AgentContext
): Promise<[
  Agent<unknown>, 
  FunctionDefinition[], 
  string, 
  AgentFunctionBase<unknown>[]
]> => {
  const allAgents: Agent[] = [
    DeveloperAgent,
    ResearcherAgent,
    DataAnalystAgent,
    WebResearcherAgent
  ].map(agentClass => new agentClass(context.cloneEmpty()));

  const agentsWithPrompts = allAgents.map(agent => {
    return {
      expertise: agent.config.prompts.expertise + "\n" + agent.config.functions.map(x => x.name).join("\n"),
      persona: agent.config.prompts.initialMessages({ goal: "" })[0].content ?? "",
      agent,
    };
  });

  const result = await Rag.standard(agentsWithPrompts, context)
    .limit(1)
    .selector(x => x.expertise)
    .query(query);

  const agents = result
    .sortByIndex()
    .onlyUnique();

  console.log("Selected agents: ", agents.map(x => x.agent.config.prompts.name));

  const agentWithPrompt = agents[0];

  return [
    agentWithPrompt.agent, 
    agentWithPrompt.agent.config.functions.map(f => f.getDefinition()),
    agentWithPrompt.persona, 
    agentsWithPrompts.map(x => x.agent.config.functions).flat()
  ];
};
