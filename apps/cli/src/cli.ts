import { createApp } from "./app";
import { Logger, Timeout } from "@evo-ninja/agent-utils";
import { program } from "commander";

export async function cli(): Promise<void> {
  program
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
      logger.error("Agent has timed out");
      process.exit(1);
    },
  );

  const app = createApp({
    timeout,
    rootDir: options.root,
    debug: options.debug,
    messagesPath: options.messages,
    sessionName: options.session,
  });

  await app.logger.logHeader();

  // Refactored goal handling into a separate async function
  async function handleGoal(goal: string) {
    app.debugLog?.goalStart(goal);

    let iterator = options.messages ? app.evo.runWithChat([...app.chat.messages]) : app.evo.run({ goal });

    while (true) {
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
};

// Loop to handle multiple goals
while (true) {
  let goal = program.args.shift(); // Get the next goal from the args array

  if (!goal) {
    goal = await app.logger.prompt("Enter your next goal: ");
    if (!goal) break; // Exit if no goal is provided
  }

  await handleGoal(goal);
}

return Promise.resolve();
}

cli()
.then(() => {
  process.exit(0);
})
.catch((err) => {
  console.error(err);
  process.abort();
});