import { AgentProtocolWorkspace } from "./agent-protocol";
import { createApp } from "./app";
import { AgentOutput } from "@evo-ninja/agents";

import Agent, {
  StepHandler,
  StepInput,
  StepResult,
  TaskInput,
} from "agent-protocol";
import { exec } from "child_process";
import path from "path";
import { program } from "commander";

const rootDir = path.resolve(
  path.join(__dirname, "../../../")
);

const sessionsDir = process.env.AGENT_WORKSPACE || path.join(rootDir, "sessions");

const options = program
  .option("-c, --clean")
  .parse()
  .opts();

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

  const customWorkspacePath = path.join(sessionsDir, id);
  const customWorkspace = new AgentProtocolWorkspace(
    customWorkspacePath
  );
  const app = await createApp({
    rootDir,
    customWorkspace,
    sessionName: id,
    debug: true,
  });

  app.logger.info("\n////////////////////////////////////////////");
  app.logger.info(`Trying to achieve goal: ${input}\nTask with ID: ${id}`);
  app.debugLog?.goalStart(input);

  let iterator = app.evo.run({ goal: input });

  async function stepHandler(stepInput: StepInput | null): Promise<StepResult> {
    app.logger.info(`Running step....`);
    app.debugLog?.stepStart();
    const response = await iterator.next(stepInput);
    app.debugLog?.stepEnd();

    const logMessage = (message: AgentOutput) => {
      const messageStr = `${message.title}  \n${message.content ?? ""}`;
      app.logger.info(`### Action executed:\n${messageStr}`);
      app.debugLog?.stepLog(messageStr);
    }

    const logError = (error: string) => {
      app.logger.error(error);
      app.debugLog?.stepError(error);
    }

    const artifacts = customWorkspace.artifacts
    customWorkspace.cleanArtifacts();

    if (response.done) {
      if (!response.value.ok) {
        logError(response.value.error ?? "Unknown error");
      } else {
        logMessage(response.value.value);
      }
      if (options.clean) {
        app.logger.info("Removing generated scripts");
        await removeNewScripts();
      }
      app.logger.info("////////////////////////////////////////////\n");
    } else if (response.value && response.value) {
      logMessage(response.value);
    }

    const outputTitle =
      response.value && "title" in response.value
        ? response.value.title
        : "No Title";

    const outputMessage =
      response.value && "message" in response.value
        ? response.value.message
        : "No Message";

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
  workspace: sessionsDir
}).start();
