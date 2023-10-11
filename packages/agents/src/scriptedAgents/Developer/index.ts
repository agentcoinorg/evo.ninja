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
    
    const config: ScriptedAgentConfig = {
      name: "Developer",
      expertise: "Building software projects with one or more files.",
      initialMessages: ({ goal }) => [
        { 
          role: "user", 
          content: `Purpose:
    You are an expert developer assistant that excels at coding related tasks.
    You have access to the file system using the ${writeFileFn.name} and ${readFileFn.name} functions.
    You plan and write clean and effective code to files using the ${writeFileFn.name} function.
    If you are asked to implement an abstract class, you MUST implement all of its abstract methods.
    You must not interact with the user or ask question for clarification. Solve the task to the best of your abilities.`
        },
        { role: "user", content: goal},
      ],
      loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        writeFileFn,
        readFileFn,
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