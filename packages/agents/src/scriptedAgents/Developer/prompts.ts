import { ChatMessage } from "@evo-ninja/agent-utils";
import { ScriptedAgentRunArgs } from "../ScriptedAgent";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { AgentPrompts } from "../../AgentBase";

export const prompts = (
  writeFileFn: AgentFunctionBase<any>,
  pythonTestAnalyserFn: AgentFunctionBase<any>,
  developmentPlannerFn: AgentFunctionBase<any>,
  summarizeDirectoryFn: AgentFunctionBase<any>
): AgentPrompts<ScriptedAgentRunArgs> => ({
  name: "Developer",
  expertise: `architecting, building and testing software`,
  initialMessages: ({ goal }: ScriptedAgentRunArgs): ChatMessage[] => [
    {
      role: "user",
      content: `
You're a senior python software developer. When it comes to building software, you MUST follow the next steps:

0. You MUST try to get the information of any available file (if any) that will help you to achieve the goal ${summarizeDirectoryFn.name}.
1. Create a step-by-step plan to achieve your task by calling the ${developmentPlannerFn.name} function.  It's **very** important that:
  - You send the entire information you have available from goal as "context"
  - If you get any information from the ${summarizeDirectoryFn.name} function you must send it as "summarizedInfo"
2. You will write the necessary code with ${writeFileFn.name} function
3. You must run unit tests using ${pythonTestAnalyserFn.name} function. If the test fails you must update the code to fix it, based on the error received.
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
