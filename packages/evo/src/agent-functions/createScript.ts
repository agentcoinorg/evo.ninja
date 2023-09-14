import { ResultErr, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, AgentChatMessage } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "@evo-ninja/script-writer-agent";
import { AgentContext } from "../AgentContext";
import { OTHER_EXECUTE_FUNCTION_OUTPUT, FUNCTION_CALL_FAILED } from "../prompts";

const FN_NAME = "createScript";

export function createScript(createScriptWriter: () => ScriptWriter): AgentFunction<AgentContext> {
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
    buildChatMessage(args: any, result: AgentFunctionResult): AgentChatMessage {
      const argsStr = JSON.stringify(args, null, 2);
  
      return result.ok
        ? {
            type: "success",
            title: `Created '${args.namespace}' script.`,
            content: 
              `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
              OTHER_EXECUTE_FUNCTION_OUTPUT(result.value),
          }
        : {
            type: "error",
            title: `Failed to create '${args.namespace}' script!`,
            content: FUNCTION_CALL_FAILED(FN_NAME, result.error, args),
          };
    },
    buildExecutor(context: AgentContext) {
      return async (options: { namespace: string, description: string, arguments: string }): Promise<AgentFunctionResult> => {
        if (options.namespace.startsWith("agent.")) {
          return ResultErr(`Cannot create an script with namespace ${options.namespace}. Try searching for script in that namespace instead.`);
        }

        // Create a fresh ScriptWriter agent
        const writer = createScriptWriter();

        context.logger.notice(`Creating script '${options.namespace}'...`);

        let iterator = writer.run(options.namespace, options.description, options.arguments);

        while(true) {
          const response = await iterator.next();

          if (response.done) {
            if (!response.value.ok) {
              return ResultErr(response.value.error);
            }
            break;
          }

          response.value && context.logger.info(response.value.message.title);

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
  
        return ResultOk(
          `Created the following scripts:` + 
          `\n--------------\n` + 
          `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}` +
          `\n--------------\n`
        );
      };
    }
  };
};
