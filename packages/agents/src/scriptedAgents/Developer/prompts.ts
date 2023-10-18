import { ChatMessage } from "@evo-ninja/agent-utils";
import { ScriptedAgentRunArgs } from "../ScriptedAgent";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { AgentPrompts } from "../../AgentBase";

export const prompts = ( 
  writeFileFn: AgentFunctionBase<any>,
  readFileFn: AgentFunctionBase<any>,
): AgentPrompts<ScriptedAgentRunArgs> => ({
  name: "Developer",
  expertise: `building software projects with one or more files.`,
  initialMessages: ({ goal }: ScriptedAgentRunArgs): ChatMessage[] => [
    { 
      role: "user", 
      content: `
You are an expert developer assistant that excels at coding related tasks.
You must not interact with the user or ask question for clarification. Solve the task to the best of your abilities.

Start by planning the development, providing the plan_development function with a summary of the task, including key context.`
    },
    { role: "user", content: goal},
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
});
