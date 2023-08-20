import { Evo } from "./agents/evo";
import { FileSystemWorkspace } from "./sys/workspaces";

import readline from "readline";
import path from "path";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const prompt = (query: string) => new Promise<string>(
  (resolve) => rl.question(query, resolve)
);

export async function cli(): Promise<void> {
  let goal: string | undefined = process.argv[2];

  if (!goal) {
    goal = await prompt("Enter your goal: ");
  }

  const evo = new Evo(new FileSystemWorkspace(
    path.join(__dirname, "../workspace")
  ));

  let iterator = evo.run(goal);

  while(true) {
    const response = await iterator.next();

    response.value.message && console.log(response.value.message);
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
