import { createApp } from "./app";

import { Logger, Timeout } from "@evo-ninja/agent-utils";
import { program } from "commander";

export async function cli(): Promise<void> {
  program
    .argument("[goal]", "Goal to be achieved")
    .option("-s, --session <name>")
    .option("-t, --timeout <seconds>")
    .option("-r, --root <path>")
    .option("-d, --debug")
    .option("-m, --messages <path>")
    .parse();

  const options = program.opts();

  const timeout = new Timeout(
    options.timeout,
    (logger: Logger): void => {
      logger.error("Agent has timeout");
      process.exit(0);
    },
  );

  const app = createApp({
    timeout,
    rootDir: options.root,
    debug: options.debug,
    messagesPath: options.messages,
    sessionName: options.session
  });

  await app.logger.logHeader();

  let goal: string | undefined = program.args[0]

  if (!goal && !options.messages) {
    goal = await app.logger.prompt("Enter your goal: ");
  }

  app.debugLog?.goalStart(goal);

  let iterator = options.messages ? app.evo.runWithChat([...app.chat.messages]) : app.evo.run({ goal });

  while(true) {
    app.debugLog?.stepStart();

    const response = await iterator.next();

    app.debugLog?.stepEnd();

    const logMessage = (message: any) => {
      const messageStr = `${message.title}\n${message.content}`;
      app.fileLogger.info(`# Evo:\n${messageStr}`);
      app.consoleLogger.info(`Evo: ${messageStr}`);
      app.debugLog?.stepLog(message);
    }

    const logError = (error: string) => {
      app.logger.error(error ?? "Unknown error");
      app.debugLog?.stepError(error);
    }

    if (response.done) {
      if (!response.value.ok) {
        logError(response.value.error ?? "Unknown error");
      } else {
        logMessage(response.value.value);
      }
      break;
    }

    if (response.value && response.value) {
      logMessage(response.value);
    }
  }

  app.debugLog?.goalEnd();

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
