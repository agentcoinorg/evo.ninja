export enum AgentOutputType {
  SUCCESS = "sucess",
  ERROR = "error",
  INFO = "info",
  WARNING = "warning"

}

export interface AgentOutput {
  type: AgentOutputType;
  title: string;
  content?: string;
}
