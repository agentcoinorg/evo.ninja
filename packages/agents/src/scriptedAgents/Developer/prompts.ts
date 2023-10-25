import { ChatMessage } from "@evo-ninja/agent-utils";
// import { AgentFunctionBase } from "../../AgentFunctionBase";
import { GoalRunArgs } from "../../Agent";
import { AgentPrompts } from "../../AgentPrompts";

export const prompts = (): AgentPrompts<GoalRunArgs> => ({
  name: "Developer",
  expertise: `architect and build complex software. specialized in python`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [
    { 
      role: "user", 
      content: `You are a senior software developer that excels at building complex software. You must start with a plan to succcesfully achieve the goal before starting to write anything.`},
    { role: "user", content: goal},
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
});
