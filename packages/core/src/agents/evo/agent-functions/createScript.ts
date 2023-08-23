import { ScriptWriter } from "../../script-writer";
import { AgentContext, AgentFunction } from "../../agent-function";

export function createScript(createScriptWriter: () => ScriptWriter): AgentFunction {
  return {
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
          },
          required: ["namespace", "description", "arguments"],
          additionalProperties: false
        },
    },
    buildExecutor: (
      context: AgentContext
    ) => {
      return async (options: { namespace: string, description: string, arguments: string }) => {
        if (options.namespace.startsWith("agent.")) {
          return {
            ok: false,
            result: `Cannot create an script with namespace ${options.namespace}. Try searching for script in that namespace instead.`,
          }
        }

        // Create a fresh ScriptWriter agent
        const writer = createScriptWriter();

        context.logger.notice(`Creating script '${options.namespace}'...`);

        let iterator = writer.run(options.namespace, options.description, options.arguments);

        while(true) {
          const response = await iterator.next();

          response.value.message && context.logger.info(response.value.message);

          // TODO: we should not be communicating the ScriptWriter's completion
          //       via a special file in the workspace
          if (writer.workspace.existsSync("index.js")) {
            break;
          }
        }

        const index = writer.workspace.readFileSync("index.js");

        const op = {
          name: options.namespace,
          description: options.description,
          arguments: options.arguments,
          code: index
        };
        context.scripts.addScript(options.namespace, op);
  
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
};
