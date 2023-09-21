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
  const workspacePath = path.join(process.cwd(), "../../workspace", id)
  const workspace = new AgentProtocolWorkspace(workspacePath);
  const app = createApp({ userWorkspace: workspace });

  let iterator = app.evo.run(input);

  async function stepHandler(stepInput: StepInput | null): Promise<StepResult> {
    const response = await iterator.next(stepInput);
    const outputMessage =
      response.value && "message" in response.value
        ? response.value.message
        : "No message";

    const artifacts = workspace.createArtifacts();
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
