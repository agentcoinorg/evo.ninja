import { AgentProtocolWorkspace } from "./agent-protocol";
import { createApp } from "./app";

import Agent, {
  StepHandler,
  StepInput,
  StepResult,
  TaskInput,
} from "forked-agent-protocol";
import { exec } from "child_process";
import path from "path";

const rootDir = path.resolve(
  path.join(__dirname, "../../../")
);

const workspaceDir = process.env.AGENT_WORKSPACE || path.join(rootDir, "workspace");

function removeNewScripts() {
  return new Promise(function (resolve, reject) {
    exec(
      "git clean -fd",
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

  const workspace = new AgentProtocolWorkspace(
    path.join(workspaceDir, id)
  );
  const app = createApp({
    rootDir,
    userWorkspace: workspace,
    taskId: id,
    debug: true,
  });

  const { logger, debugLog } = app;

  logger.info("\n////////////////////////////////////////////");
  logger.info(`Trying to achieve goal: ${input}\nTask with ID: ${id}`);
  debugLog?.goalStart(input);

  let iterator = app.evo.run(input);

  async function stepHandler(stepInput: StepInput | null): Promise<StepResult> {
    logger.info(`Running step....`);
    debugLog?.stepStart();
    const response = await iterator.next(stepInput);
    debugLog?.stepEnd();

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
        logger.error(response.value.error ?? "Unknown error");
        debugLog?.stepError(response.value.error ?? "Unknown error");
      } else {
        logger.info(JSON.stringify(response.value.value) as any);
        debugLog?.stepLog(response.value.value as any);
      }
      logger.info("Task is done - Removing generated scripts...");
      await removeNewScripts();
      logger.info("////////////////////////////////////////////\n");
    }

    if (outputMessage !== "No Message") {
      logger.info(JSON.stringify(outputMessage));
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

Agent.handleTask(taskHandler, {
  workspace: workspaceDir
}).start();
