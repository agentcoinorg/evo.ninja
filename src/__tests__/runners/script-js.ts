import { getScriptByName } from "../../scripts";
import { nodeShims, functionCodeWrapper } from "../../boilerplate";
import { WrapClient } from "../../wrap";
import { JS_ENGINE_URI } from "../../constants";
import { FileSystemWorkspace } from "../../workspaces";
import fs from "fs";

export async function runScriptJs(
  scriptName: string,
  scriptArgsPath?: string
): Promise<void> {

  const script = getScriptByName(scriptName);

  if (!script) {
    throw Error(`Cannot find script (${scriptName})`);
  }

  const globals: { name: string, value: string }[] = [];

  const scriptArgs = scriptArgsPath && JSON.parse(fs.readFileSync(
    scriptArgsPath,
    "utf-8"
  )) as Record<string, unknown>;

  if (scriptArgs) {
    if (typeof scriptArgs !== "object") {
      throw Error(`Script args must be a JSON object (${scriptArgsPath})`);
    }

    for (const entry of Object.entries(scriptArgs)) {
      globals.push({
        name: entry[0],
        value: JSON.stringify(entry[1])
      });
    }
  }

  const client = new WrapClient(new FileSystemWorkspace());

  const invokeArgs = {
    src: nodeShims + functionCodeWrapper(script.code),
    globals,
  };

  const result = await client.invoke<{value: string | undefined, error: string | undefined}>({ 
    uri: JS_ENGINE_URI,
    method: "evalWithGlobals",
    args: invokeArgs,
  });

  console.log(result);

  console.log(client.jsPromiseOutput);
}

const args = process.argv;

if (args.length < 3) {
  throw Error("Usage: ts-node ./script-js.ts <script-name> (./args.json)");
}

const scriptName = args[2];
const scriptPath = args.length > 2 ? args[3] : undefined;

runScriptJs(scriptName, scriptPath)
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.abort();
  });
