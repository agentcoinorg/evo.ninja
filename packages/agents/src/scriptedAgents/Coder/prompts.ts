import { ChatMessage } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { GoalRunArgs } from "../../Agent";
import { AgentPrompts } from "../../AgentPrompts";

export const prompts = ( 
  writeFileFn: AgentFunctionBase<any>,
  onGoalAchieved: AgentFunctionBase<any>,
): AgentPrompts<GoalRunArgs> => ({
  name: "Coder",
  expertise: `building software projects with one or more files.`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [
    { 
      role: "user", 
      content: `
You are an expert Python coder assistant that excels at writing Python code.

You will extract the Python code from the given message and write it to a file using ${writeFileFn.name}.
You will then call ${onGoalAchieved.name}
`
    },
    { role: "user", content: goal},
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
});
