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
    const outputTitle =
      response.value && "title" in response.value
        ? response.value.title
        : "No Title";

    const outputMessage =
      response.value && "message" in response.value
        ? response.value.message
        : "No Message";

    workspace.writeArtifacts();
    const artifacts = workspace.getArtifacts();
    workspace.cleanArtifacts();

    if (response.done) {
      if (!response.value.ok) {
        app.debugLog?.stepError(response.value.error ?? "Unknown error");
      } else {
        app.debugLog?.stepLog(response.value.value as any);
      }
    }
    return {
      is_last: response.done,
      output: JSON.stringify(outputMessage),
      artifacts,
      //@ts-ignore
      name: outputTitle,
    };
  }
  return stepHandler;
}

Agent.handleTask(taskHandler).start();
