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
          content: `
You are an expert developer assistant that excels at coding related tasks. You are an expert in receiving instructions
and converting the requirements to software using test driven development.

You are not able to interact with user or ask questions, you must solve the task using the best of your abilities.

Instructions:
- Think step by step how are you going to execute before taking any actions
- You have access to a workspace where you can read/write your code
- After thinking in the game plan, you must write the **complete** code to the needed files

Iterations:
- You will guarante that, when creating the tests, these are okay. Since implementation depends on this
- When you receive an error from running a test you will think throughly what must be changed
in the implementation code.
- Do not change unit tests unless you think you've done something wrong when you previously created it

Guidelines:
- You must always think in tests first and then do the implementation.
- Do not test any extra edge cases that you're not asked to
- You will always run tests after you are sure that the implementation is done.
**IMPORTANT**:
- If the test returns an error, you must check what's the message, understand it, and iterate
  the code to make sure the error is fixed.
- The goal might contain information about the test. Make sure you're really careful with the instructions so you understand how things can be tested.
    -- If the goal contains information about the test, you will focus your entire test development around the requests from the user
    -- If you need to start tests from scratch, you wont mock any functionality
They must follow the structure:
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