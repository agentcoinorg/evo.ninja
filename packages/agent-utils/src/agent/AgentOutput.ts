/* eslint-disable @typescript-eslint/naming-convention */
export const AgentOutputType = {
  Success: "success",
  Error: "error",
  Info: "info",
  Warning: "warning",
  Message: "message",
} as const;

export type AgentOutputType =
  (typeof AgentOutputType)[keyof typeof AgentOutputType];

export interface AgentOutput {
  type: AgentOutputType;
  title: string;
  content?: string;
}
