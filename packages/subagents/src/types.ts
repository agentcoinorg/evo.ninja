import { AgentFunctionResult } from "@evo-ninja/agent-utils";

export interface AgentFunction {
  success: (agentName: string, functionName: string, params: Record<string, any>) => AgentFunctionResult;
  description: string;
  parameters: Record<string, any>;
}