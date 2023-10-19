import { ChatMessage } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { AgentPrompts, GoalRunArgs } from "../../Agent";

export const prompts = ( 
  writeFileFn: AgentFunctionBase<any>,
  readFileFn: AgentFunctionBase<any>,
): AgentPrompts<GoalRunArgs> => ({
  name: "Developer",
  expertise: `building software projects with one or more files.`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [
    { 
      role: "user", 
      content: `
You are an expert developer assistant that excels at coding related tasks.
You have access to the file system using the ${writeFileFn.name} and ${readFileFn.name} functions.
You plan and write clean and effective code to files using the ${writeFileFn.name} function.
You must not interact with the user or ask question for clarification. Solve the task to the best of your abilities.`
    },
    { role: "user", content: goal},
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
});
