import { ScriptWriter } from "../../script-writer";
import { AgentFunction } from "../../agent-function";
import { WrapClient } from "../../../wrap";
import { addScript } from "../../../scripts";
import { InMemoryWorkspace } from "../../../sys/workspaces";
import chalk from "chalk";

export const createScript: AgentFunction = {
  definition: {
    name: "createScript",
      description: `Create a script using JavaScript.`,
      parameters: {
        type: "object",
        properties: {
          namespace: {
            type: "string",
            description: "The namespace of the script, e.g. fs.readFile"
          },
          description: {
            type: "string",
            description: "The detailed description of the script."
          },
          arguments: {
            type: "string",
            description: "The arguments of the script. E.g. '{ path: string, encoding: string }'. Use only what you need, no optional arguments."
          },
          developerNote: {
            type: "string",
            description: "A note for the developer of the script, if any."
          }
        },
        required: ["namespace", "description", "arguments"],
        additionalProperties: false
      },
  },
  buildExecutor: (
    globals: Record<string, string>,
    client: WrapClient
  ) => {
    return async (options: { namespace: string, description: string, arguments: string, developerNote?: string }) => {
      if (options.namespace.startsWith("agent.")) {
        return {
          ok: false,
          result: `Cannot create an script with namespace ${options.namespace}. Try searching for script in that namespace instead.`,
        }
      }

      const workspace = new InMemoryWorkspace();
      const writer = new ScriptWriter(workspace);
      console.log(chalk.yellow(`Creating script '${options.namespace}'...`));

      let iterator = writer.run(options.namespace, options.description, options.arguments, options.developerNote);

      while(true) {
        const response = await iterator.next();

        response.value.message && console.log(chalk.yellow(response.value.message));

        if (workspace.existsSync("index.ts")) {
          break;
        }
      }

      const index = workspace.readFileSync("index.ts");

      const op = {
        name: options.namespace,
        description: options.description,
        arguments: options.arguments,
        code: index
      };
      addScript(options.namespace, op);

      const candidates = [
       op
      ];

      return {
        ok: true,
        result: `Created the following scripts:` + 
        `\n--------------\n` + 
        `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}` +
        `\n--------------\n`,
      };
    };
  }
};
