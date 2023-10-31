import { RunnableAgent } from "../agent";
import { AgentContext } from "../agent/AgentContext";

export const agentFunctionBaseToAgentFunction = <TRunArgs>(agent: RunnableAgent<TRunArgs>) => {
  return (fn: any) => {
    return {
      definition: fn.getDefinition(),
      buildExecutor: (_: AgentContext) => {
        return fn.buildExecutor(agent);
      }
    }
  };
};
