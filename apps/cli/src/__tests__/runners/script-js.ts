import { FileSystemWorkspace } from "../../sys/FileSystemWorkspace";

import {
  Workspace,
  Logger,
  ConsoleLogger
} from "@evo-ninja/agent-utils";
import { JsEngine_GlobalVar, JsEngine, Scripts, WrapClient, shimCode } from "@evo-ninja/evo-agent";
import fs from "fs";
import path from "path-browserify";

export async function runScriptJs(
  workspace: Workspace,
  scripts: Scripts,
  scriptName: string,
  scriptArgsPath?: string
): Promise<void> {

  const script = scripts.getScriptByName(scriptName);

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

  const logger = new Logger([new ConsoleLogger()], {
    promptUser: () => Promise.resolve("N/A"),
    logUserPrompt: () => {}
  });
  const client = new WrapClient(workspace, logger);

  const jsEngine = new JsEngine(client);
  const result = await jsEngine.evalWithGlobals({
    src: shimCode(script.code),
    globals,
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

const workspace = new FileSystemWorkspace(
  path.join(__dirname, "../../../../../workspace")
);
const scripts = new Scripts(
  workspace,
  path.join(__dirname, "../../../../../scripts")
);

runScriptJs(workspace, scripts, scriptName, scriptPath)
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.abort();
  });
