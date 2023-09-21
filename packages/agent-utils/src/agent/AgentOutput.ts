export interface AgentOutput {
  type: "success" | "error" | "info" | "warning";
  title: string;
  content?: string;
}
