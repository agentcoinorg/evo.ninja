import { createApp } from "./app";
import { Logger, Timeout } from "@evo-ninja/agent-utils";
import { AgentOutput } from "@evo-ninja/agents";
import { program } from "commander";

export async function cli(): Promise<void> {
  program
    .option("-s, --session <name>")
    .option("-t, --timeout <seconds>")
    .option("-r, --root <path>")
    .option("-d, --debug")
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
    sessionName: options.session,
  });

  await app.logger.logHeader();

  async function handleGoal(goal: string) {
    app.debugLog?.goalStart(goal);

    let iterator = app.evo.run({ goal });
    let stepCounter = 1;

    while (true) {
      app.debugLog?.stepStart();
      app.logger.info(`## Step ${stepCounter}\n`)
      const response = await iterator.next();
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
      stepCounter++
    }

    app.debugLog?.goalEnd();
    return Promise.resolve();
  }

  let goal: string | undefined = program.args[0];
  let goalCounter = 0;

  while (true) {
    if (!goal) {
      goal = await app.logger.prompt("Enter your goal");
    } else if (goalCounter === 0) {
      app.fileLogger.info("# User\n **Enter your goal:** " + goal);
    } else {
      goal = await app.logger.prompt("Enter another goal");
      app.evo.reset();
    }

    if (!goal || goal.toLocaleLowerCase() === "exit") break;

    ++goalCounter;
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
