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

const rootDir = path.join(__dirname, "../../../");

// AGENT_WORKSPACE is used by the agent-protocol
if (!process.env.AGENT_WORKSPACE) {
  process.env.AGENT_WORKSPACE = path.join(rootDir, "workspace");
}

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

  const workspace = new AgentProtocolWorkspace(
    path.join(
      process.env.AGENT_WORKSPACE as string, id
    )
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
      await execPromise("git clean -fd");
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

Agent.handleTask(taskHandler).start();
