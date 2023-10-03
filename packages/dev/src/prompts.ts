import { AgentFunctionDefinition } from "@evo-ninja/agent-utils";

export const INITIAL_PROMP = (functions: AgentFunctionDefinition[]) =>
  `You are an expert software engineer named "dev".`;

export const GOAL_PROMPT = (goal: string) =>
  `You have been asked by the user to achieve the following goal: ${goal}`;

export const LOOP_PREVENTION_PROMPT = 
  "Assistant, you appear to be in a loop, try executing a different function.";
