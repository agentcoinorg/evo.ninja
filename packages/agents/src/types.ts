import { AgentFunctionResult } from "@evo-ninja/agent-utils";

export interface AgentFunction {
  success: (params: Record<string, any>) => AgentFunctionResult;
  description: string;
  parameters: Record<string, any>;
}