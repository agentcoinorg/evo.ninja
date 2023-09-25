import { AgentProtocolWorkspace } from "./sys/AgentProtocolWorkspace";
import { createApp } from "./app";

import path from "path";
import Agent, {
  StepHandler,
  StepInput,
  StepResult,
  TaskInput,
} from "forked-agent-protocol";

async function taskHandler(
  id: string,
  input: TaskInput | null
): Promise<StepHandler> {
  const rootDir = path.join(process.cwd(), "../..");
  const workspace = new AgentProtocolWorkspace(
    path.join(rootDir, "workspace", id)
  );
  const app = createApp({
    rootDir,
    userWorkspace: workspace,
    taskId: id,
    debug: true,
  });

  app.debugLog?.goalStart(input);
  let iterator = app.evo.run(input);
  async function stepHandler(stepInput: StepInput | null): Promise<StepResult> {
    app.debugLog?.stepStart();
    const response = await iterator.next(stepInput);
    app.debugLog?.stepEnd();
    const outputMessage =
      response.value && "title" in response.value
        ? response.value.title
        : "No message";

    console.log("Response from iterator");
    console.log(response);
    console.log("This is the output message:");
    console.log(outputMessage);
    workspace.writeArtifacts();
    const artifacts = workspace.getArtifacts();
    workspace.cleanArtifacts();
    return {
      is_last: response.done,
      output: outputMessage,
      artifacts,
      //@ts-ignore
      name: outputMessage
    };
  }
  return stepHandler;
}

Agent.handleTask(taskHandler).start();
