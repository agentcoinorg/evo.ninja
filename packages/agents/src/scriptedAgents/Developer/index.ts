import { ScriptedAgent, ScriptedAgentConfig, ScriptedAgentContext } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { RunTestPythonAnalyser } from "../../functions/RunTestPythonAnalyser";

export class DeveloperAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.client, context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.client, context.scripts);
    const writeFileFn = new WriteFileFunction(context.client, context.scripts);
    const readFileFn = new ReadFileFunction(context.client, context.scripts);
    const readDirFn = new ReadDirectoryFunction(context.client, context.scripts);
    const pythonTestAnalyser = new RunTestPythonAnalyser(context.llm, context.chat.tokenizer, context.client);

    const config: ScriptedAgentConfig = {
      name: "Developer",
      expertise: "architecting, building and testing software",
      initialMessages: ({ goal }) => [
        { 
          role: "user", 
          content: ` # Test Driven Development
\\\\ You are an expert software engineer that excels at code-related tasks. 
\\\\ You are an expert at converting user-specified requirements to software using test driven development.
\\\\ **You are unable to interact with the user.**
## Instructions
- Take a deep breath and work on the problem step by step.
- You can access the file system to read files and directories, and to write code.
- Always write tests before writing the implementation.
- Always write the **complete** solution. The code should always work as expected when copying it to a file and running it.
## Required Workflow
1. write tests using ${writeFileFn.name}
2. write code implementation using ${writeFileFn.name}
3. run tests using ${pythonTestAnalyser.name}
4. read test results
5. if tests failed, fix implementation
6. repeat steps 3-6 until all tests pass
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
`
        },
        { role: "user", content: goal},
      ],
      loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        writeFileFn,
        readFileFn,
        readDirFn,
        pythonTestAnalyser
      ],
      shouldTerminate: (functionCalled) => {
        return [
          onGoalAchievedFn.name,
          onGoalFailedFn.name
        ].includes(functionCalled.name);
      },
    };

    super(config, context);
  }
}