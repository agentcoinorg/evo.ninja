import { FileSystemWorkspace } from "./workspaces";
import fs from "fs";
import { WrapClient } from "./wrap";
import { JS_ENGINE_URI } from "./constants";

export async function run(): Promise<void> {
  const client = new WrapClient(new FileSystemWorkspace());

  const code = fs.readFileSync("js-shims.js", "utf8");

  const invokeArgs = {
    src: code,
    globals: [],
  };

  const result = await client.invoke<{value: string | undefined, error: string | undefined}>({ 
    uri: JS_ENGINE_URI,
    method: "evalWithGlobals",
    args: invokeArgs,
  });

  console.log(result);

  console.log(client.jsPromiseOutput);
}

run()
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.abort();
  });
