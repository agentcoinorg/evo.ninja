import { FunctionDefinition, Rag, ArrayRecombiner, InMemoryWorkspace } from "@evo-ninja/agent-utils";
import { Agent, GoalRunArgs } from "../../Agent";
import { AgentContext } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { DeveloperAgent, ResearcherAgent, DataAnalystAgent, WebResearcherAgent } from "../../scriptedAgents";

type AgentWithPrompts = {
  expertise: string;
  persona: string;
  agent: Agent<GoalRunArgs>;
};

const workspace = new InMemoryWorkspace();
const AGENT_COLLECTION_NAME = "agents-for-prediction";
let isDbInitialized = false;

export const findBestAgent = async (
  queryOrVector: string | number[], 
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
    WebResearcherAgent,
  ].map(agentClass => new agentClass(context.cloneEmpty()));

  const agentsWithPrompts = allAgents.map(agent => {
    return {
      expertise: agent.config.prompts.expertise + "\n" + agent.config.functions.map(x => x.name).join("\n"),
      persona: agent.config.prompts.initialMessages({ goal: "" })[0].content ?? "",
      agent,
    };
  });

  let rag;

  if (!isDbInitialized) {
    rag = await Rag.standard<AgentWithPrompts>(context, AGENT_COLLECTION_NAME, workspace)
      .selector(x => x.expertise)
      .addItems(agentsWithPrompts)
      .forceAddItemsToCollection();
    
    isDbInitialized = true;
  } else {
    rag = Rag.standard<AgentWithPrompts>(context, AGENT_COLLECTION_NAME, workspace, agentsWithPrompts)
      .selector(x => x.expertise);
  }

  const agents = await rag
    .query(queryOrVector)
    .recombine(ArrayRecombiner.standard({
      limit: 1,
    }));

  console.log("Selected agents: ", agents.map(x => x.agent.config.prompts.name));

  const agentWithPrompt = agents[0];

  return [
    agentWithPrompt.agent,
    agentWithPrompt.agent.config.functions.map(f => f.getDefinition()),
    agentWithPrompt.persona,
    agentsWithPrompts.map(x => x.agent.config.functions).flat()
  ];
};
