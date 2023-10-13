import { ScriptedAgent, ScriptedAgentConfig, ScriptedAgentContext } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";

export class DeveloperAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.client, context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.client, context.scripts);
    const writeFileFn = new WriteFileFunction(context.client, context.scripts);
    const readFileFn = new ReadFileFunction(context.client, context.scripts);
    const readDirFn = new ReadDirectoryFunction(context.client, context.scripts)
    
    const config: ScriptedAgentConfig = {
      name: "Developer",
      expertise: "Building software projects with one or more files.",
      initialMessages: ({ goal }) => [
        { 
          role: "user", 
          content: `Purpose:
You are an expert developer assistant that excels at coding related tasks.
You have access to the file system using the ${writeFileFn.name}, ${readFileFn.name}, and ${readDirFn.name} functions.
You must not interact with the user or ask questions. Solve the task to the best of your abilities.
Never guess the name of a file.
Three-Step Workflow:
1. If you need to know the contents of a directory or file, use ${readDirFn.name} or ${readFileFn.name}.
2. Write the COMPLETE, clean, safe, code solution to one or more files using the ${writeFileFn.name} function.
3. Signal completion using the ${onGoalAchievedFn.name} function.
You can only write to the same file twice if you are modifying code that you already wrote.
COMPLETE SOLUTION:
Follow instructions. Do not skip anything. Write the COMPLETE solution in one step. The code should work perfectly without further changes.
If you are asked to implement an abstract class, you MUST import it, extend it, and implement all its abstract methods.`
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
        new ReadDirectoryFunction(context.client, context.scripts)
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