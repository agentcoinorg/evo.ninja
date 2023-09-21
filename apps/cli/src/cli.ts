import { createApp } from "./app";

import { Logger, Timeout } from "@evo-ninja/agent-utils";
import { program } from "commander";
import { FileSystemWorkspace } from "./sys";
import path from "path";

export async function cli(): Promise<void> {
  const rootDir = path.join(__dirname, "../../../");
  program
    .argument("[goal]", "Goal to be achieved")
    .option("-t, --timeout <number>")
    .parse();

  const options = program.opts();

  const timeout = new Timeout(
    options.timeout,
    (logger: Logger): void => {
      logger.error("Agent has timeout");
      process.exit(0);
    },
  );

  const userWorkspace = new FileSystemWorkspace(
    path.join(rootDir, "workspace")
  )
  const app = createApp({ timeout, userWorkspace });

  await app.logger.logHeader();

  let goal: string | undefined = program.args[0]

  if (!goal) {
    goal = await app.logger.prompt("Enter your goal: ");
  }

  let iterator = app.evo.run(goal);

  while(true) {
    const response = await iterator.next();

    const logMessage = (message: any) => {
      const messageStr = `${message.title}\n${message.content}`;
      app.fileLogger.info(`# Evo:\n${messageStr}`);
      app.consoleLogger.info(`Evo: ${messageStr}`);
    }

    if (response.done) {
      if (!response.value.ok) {
        app.logger.error(response.value.error ?? "Unknown error");
      } else {
        logMessage(response.value.value.message);
      }
      break;
    }

    if (response.value && response.value.message) {
      logMessage(response.value.message);
    }
  }

  return Promise.resolve();
}

cli()
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.abort();
  });
