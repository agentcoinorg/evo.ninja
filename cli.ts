import readline from "readline";

export async function cli(): Promise<void> {
  let goal: string | undefined = process.argv[2];

  if (!goal) {
    goal = await prompt("Enter your goal: ");
  }

  const agent = new Agent();

  let iterator = agent.run(goal);

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

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));
