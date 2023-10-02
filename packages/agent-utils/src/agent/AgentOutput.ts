export const AgentOutputType = {
  Success: "success",
  Error: "error",
  Info: "info",
  Warning: "warning"
} as const;

export type AgentOutputType = typeof AgentOutputType[keyof typeof AgentOutputType];

export interface AgentOutput {
  type: AgentOutputType;
  title: string;
  content?: string;
}
