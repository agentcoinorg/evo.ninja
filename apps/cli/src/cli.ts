import { createApp } from "./app";

export async function cli(): Promise<void> {
  const app = createApp();

  await app.logger.logHeader();

  let goal: string | undefined = process.argv[2];

  if (!goal) {
    goal = await app.logger.prompt("Enter your goal: ");
  }

  let iterator = app.evo.run(goal);

  while(true) {
    const response = await iterator.next();

    if (response.done) {
      if (!response.value.ok) {
        app.logger.error(response.value.error ?? "Unknown error");
      }
      break;
    }

    if (response.value) {
      response.value.message && app.logger.info(response.value.message.content ?? response.value.message.title);
    }
  }
}

cli()
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.abort();
  });
