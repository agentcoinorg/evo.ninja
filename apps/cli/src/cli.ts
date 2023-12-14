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
    async (logger: Logger): Promise<void> => {
      await logger.error("Agent has timed out");
      process.exit(1);
    }
  );

  const app = await createApp({
    timeout,
    rootDir: options.root,
    debug: options.debug,
    sessionName: options.session,
  });

  await app.logger.logHeader();

  async function handleGoal(goal: string): Promise<void> {
    await app.debugLog?.goalStart(goal);

    let iterator = app.evo.runWithExistingContext({ goal });
    let stepCounter = 1;

    while (true) {
      await app.debugLog?.stepStart();
      await app.logger.info(`## Step ${stepCounter}\n`);
      const response = await iterator.next();
      await app.debugLog?.stepEnd();

      const logMessage = async (message: AgentOutput) => {
        const messageStr = `${message.title}  \n${message.content ?? ""}`;
        await app.logger.info(`### Action executed:\n${messageStr}`);
        await app.debugLog?.stepLog(messageStr);
      };

      const logError = async (error: string) => {
        await app.logger.error(error);
        await app.debugLog?.stepError(error);
      };

      if (response.done) {
        if (!response.value.ok) {
          await logError(response.value.error ?? "Unknown error");
        } else {
          await logMessage(response.value.value);
        }
        break;
      }

      if (response.value && response.value) {
        await logMessage(response.value);
      }
      stepCounter++;
    }

    await app.debugLog?.goalEnd();
  }

  let goal: string | undefined = program.args[0];
  let goalCounter = 0;

  await app.evo.init();
  while (true) {
    if (!goal) {
      goal = await app.logger.prompt("Enter your goal");
    } else if (goalCounter === 0) {
      await app.fileLogger.info("# User\n **Enter your goal:** " + goal);
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
