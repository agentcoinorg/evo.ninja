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
      content: `
You are a senior software developer that excels at building complex software. You must start with a plan to succcesfully achieve the goal before starting to write anything.
When you write code you must make sure you have all the context possible so you can write as complete and correct code as possible; for example, if
you are asked to write code and you are told that information about the information is in a file, you must read that first.
If you need to update a file you must make sure that you rewrite the entire file, instead of adding the part you want to modify
`},
    { role: "user", content: goal},
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
});
