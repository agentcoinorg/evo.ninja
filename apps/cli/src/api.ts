import { AgentProtocolWorkspace } from "./sys/AgentProtocolWorkspace";
import { createApp } from "./app";

import path from "path";
import Agent, {
  StepHandler,
  StepInput,
  StepResult,
  TaskInput,
} from "forked-agent-protocol";
import { exec } from "child_process";

function execPromise(command: string) {
  return new Promise(function (resolve, reject) {
    exec(
      command,
      { cwd: path.join(__dirname, "../../../scripts") },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        console.log(stdout);
        resolve(stdout.trim());
      }
    );
  });
}

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
  app.logger.info("\n////////////////////////////////////////////");
  app.logger.info(`Trying to achieve goal: ${input}\nTask with ID: ${id}`);
  app.debugLog?.goalStart(input);
  let iterator = app.evo.run(input);

  async function stepHandler(stepInput: StepInput | null): Promise<StepResult> {
    app.debugLog?.stepStart();
    const response = await iterator.next(stepInput);
    app.debugLog?.stepEnd();
    app.logger.info(`Running step....`);
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
        app.logger.error(response.value.error ?? "Unknown error");
        app.debugLog?.stepError(response.value.error ?? "Unknown error");
      } else {
        app.logger.info(JSON.stringify(response.value.value) as any);
        app.debugLog?.stepLog(response.value.value as any);
      }
      app.logger.info("Task is done - Removing generated scripts...");
      await execPromise("git clean -fd");
      app.logger.info("////////////////////////////////////////////\n");
    }

    if (outputMessage !== "No Message") {
      app.logger.info(JSON.stringify(outputMessage));
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
