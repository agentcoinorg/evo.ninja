import { getScriptByName } from "../../scripts";
import { shimCode } from "../../wrap/js-engine/shims";
import { WrapClient } from "../../wrap";
import { JsEngine_GlobalVar, JsEngine_Module } from "../../wrap/js-engine";
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

  const globals: JsEngine_GlobalVar[] = [];

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

  const result = await JsEngine_Module.evalWithGlobals({
    src: shimCode(script.code),
    globals,
  }, client);

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
