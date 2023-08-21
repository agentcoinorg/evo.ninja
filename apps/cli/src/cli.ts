import { FileSystemWorkspace } from "./sys";

import { Evo, Scripts, Env, OpenAI, Chat } from "@evo-ninja/core";
import dotenv from "dotenv";
import readline from "readline";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";

dotenv.config({
  path: path.join(__dirname, "../../../.env")
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (query: string) => new Promise<string>(
  (resolve) => rl.question(query, resolve)
);

export async function cli(): Promise<void> {
  let goal: string | undefined = process.argv[2];

  if (!goal) {
    goal = await prompt("Enter your goal: ");
  }

  const rootDir = path.join(__dirname, "../../../");

  const workspace = new FileSystemWorkspace(
    path.join(rootDir, "workspace")
  );
  const scripts = new Scripts(
    workspace,
    path.join(rootDir, "scripts")
  );
  const env = new Env(
    process.env as Record<string, string>
  );
  const llm = new OpenAI(
    env.OPENAI_API_KEY,
    env.GPT_MODEL,
    env.CONTEXT_WINDOW_TOKENS
  );
  const chat = new Chat(
    workspace,
    llm,
    cl100k_base
  );

  const evo = new Evo(
    workspace,
    scripts,
    llm,
    chat
  );

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
