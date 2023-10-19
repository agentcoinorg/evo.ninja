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

Always start by analyzing the workspace, and getting a summary or description of all relevant existing files (if any).

Then, code the solution to the given goal using the code function. You will give the code function a precise and complete query and a list of files to consider.
The query is the goal you are trying to achieve, and the files to consider are the files you have analyzed in the workspace.

After you have coded the solution, you must write the code to a file using the write_file function.
Then, you must verify that the code you wrote is complete and correct by using the analyze_code function.

If the code is not correct, you must fix it and write it to the file again, and then verify it again.`
    },
    { role: "user", content: goal},
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
});
