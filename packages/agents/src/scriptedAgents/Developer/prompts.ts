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
You will ask to the ${developmentPlanner.name} function to write a concise and step-by-step plan. You must give all the information available to achieve the task. 
You can write the implementation and test code with ${writeFileFn.name}
You must run tests with ${pythonTestAnalyser.name} function to make sure that you've achieved the goal; you must pass the implementation code being tested

When creating tests from scratch, they must follow this structure:
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
    ` },
  { role: "user", content: goal},
];

export const LOOP_PREVENTION_PROMPT = `Assistant, you appear to be in a loop, try executing a different function.`;
