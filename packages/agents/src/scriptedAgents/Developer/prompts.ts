import { ChatMessage } from "@evo-ninja/agent-utils";
import { ScriptedAgentRunArgs } from "../ScriptedAgent";
import { AgentFunctionBase } from "../../AgentFunctionBase";

export const EXPERTISE = `architecting, building and testing software`;

export const INITIAL_MESSAGES = ( 
  writeFileFn: AgentFunctionBase<any>,
  readFileFn: AgentFunctionBase<any>,
  developmentPlanner: AgentFunctionBase<any>,
  pythonTestAnalyser: AgentFunctionBase<any>
) => ({ goal }: ScriptedAgentRunArgs): ChatMessage[] => [
  { 
    role: "user", 
    content: `
You are an expert developer assistant that excels at coding related tasks.

Before starting the build anything, you will send the entire goal **without omitting**
any information to the function ${developmentPlanner.name}, this is give you a plan to execute.

You will write the implementation and test code with ${writeFileFn.name}
You must run tests with ${pythonTestAnalyser.name} function to make sure that you've achieved the goal.
It's necessary that the implementation code is passed as context so the analyser can instruct you accordingly

## Important
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
  { role: "user", content: goal},
];

export const LOOP_PREVENTION_PROMPT = `Assistant, you appear to be in a loop, try executing a different function.`;
