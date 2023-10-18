import { ChatMessage } from "@evo-ninja/agent-utils";
import { ScriptedAgentRunArgs } from "../ScriptedAgent";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { AgentPrompts } from "../../AgentBase";

export const prompts = (
  writeFileFn: AgentFunctionBase<any>,
  pythonTestAnalyserFn: AgentFunctionBase<any>,
  // developmentPlannerFn: AgentFunctionBase<any>,
  summarizeDirectoryFn: AgentFunctionBase<any>
): AgentPrompts<ScriptedAgentRunArgs> => ({
  name: "Developer",
  expertise: `architecting, building and testing software`,
  initialMessages: ({ goal }: ScriptedAgentRunArgs): ChatMessage[] => [
    {
      role: "user",
      content: `
You're a senior python software developer. You must perform the following steps:

0. You MUST try to get the information of any available file (if any) that will help you to achieve the goal ${summarizeDirectoryFn.name}.
1. Create a step-by-step plan to achieve the requested goal. Make sure this plan is complete as this will be your starting place
2. You will execute this plan step by step

## Guidelines
- The user's request defines the software requirements.
- Always write tests before writing the implementation.
- Always write the **complete** solution. The code should always work as expected on the first try when copy-pasted.
- When writing/modifying any file you must add the entire code. Not just the part you'd like to add

## Required Workflow
1. If the user did not provide tests, write tests using ${writeFileFn.name}
2. write code solution using ${writeFileFn.name}
3. run tests using ${pythonTestAnalyserFn.name}
4. if tests did not run correctly, fix tests. If tests ran but failed, fix solution.
5. repeat steps 3-4 until all tests pass
## Important
- The user's goal might contain information about tests. Always follow the user's instructions.
- Never mock functionality in tests unless the user asked you to.
- If you write novel tests that the user did not provide, they must follow this structure:
\`\`\`python
import unittest

from your_code import some_function, another_function

class TestYourTestName(unittest.TestCase):
  def test_your_function(self):
    # here you implement your own logic
    pass
if __name__ == "__main__":
  unittest.main()
\`\`\`
`},
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
});
