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
  console.log(rootDir);
  const app = createApp({
    rootDir,
    userWorkspace: workspace,
    taskId: id,
    debug: true,
  });

  let iterator = app.evo.run(input);

  async function stepHandler(stepInput: StepInput | null): Promise<StepResult> {
    const response = await iterator.next(stepInput);
    const outputMessage =
      response.value && "message" in response.value
        ? response.value.message
        : "No message";

    console.log("This is the response from the iteration: ");
    console.log(response);

    console.log("This is the output message: ");
    console.log(outputMessage);

    workspace.writeArtifacts();
    const artifacts = workspace.getArtifacts();
    workspace.cleanArtifacts();
    return {
      is_last: response.done,
      output: JSON.stringify(outputMessage),
      artifacts,
    };
  }

  return stepHandler;
}

Agent.handleTask(taskHandler).start();
