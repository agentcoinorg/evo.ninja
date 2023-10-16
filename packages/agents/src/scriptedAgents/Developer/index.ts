import { ScriptedAgent, ScriptedAgentConfig, ScriptedAgentContext } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { RunTestPythonAnalyser } from "../../functions/RunTestPythonAnalyser";
import { DeveloperPlanner } from "../../functions/DeveloperPlanner";

export class DeveloperAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.client, context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.client, context.scripts);
    const writeFileFn = new WriteFileFunction(context.client, context.scripts);
    const readFileFn = new ReadFileFunction(context.client, context.scripts);
    const readDirFn = new ReadDirectoryFunction(context.client, context.scripts);
    const pythonTestAnalyser = new RunTestPythonAnalyser(context.llm, context.chat.tokenizer, context.client);
    const developmentPlanner = new DeveloperPlanner(context.llm, context.chat.tokenizer)

    const config: ScriptedAgentConfig = {
      name: "Developer",
      expertise: "architecting, building and testing software",
      initialMessages: ({ goal }) => [
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
`
        },
        { role: "user", content: goal },
      ],
      loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        writeFileFn,
        readFileFn,
        readDirFn,
        pythonTestAnalyser,
        developmentPlanner
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