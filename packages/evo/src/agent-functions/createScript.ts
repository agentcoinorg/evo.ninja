import { ResultErr, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, BasicAgentChatMessage } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "@evo-ninja/js-script-writer-agent";
import { AgentContext } from "../AgentContext";
import { FUNCTION_CALL_FAILED } from "../prompts";

const FN_NAME = "createScript";
type FuncParameters = { 
  namespace: string, 
  description: string, 
  arguments: string 
};

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
    buildExecutor(context: AgentContext) {
      return async (params: FuncParameters): Promise<AgentFunctionResult> => {
        if (params.namespace.startsWith("agent.")) {
          return ResultOk([
            BasicAgentChatMessage.error(
              "system", 
              `Failed to create '${params.namespace}' script!`,
              FUNCTION_CALL_FAILED(FN_NAME, `Cannot create an script with namespace ${params.namespace}. Try searching for script in that namespace instead.`, params)
            )
          ]);
        }

        // Create a fresh ScriptWriter agent
        const writer = createScriptWriter();

        context.logger.notice(`Creating script '${params.namespace}'...`);

        let iterator = writer.run(params.namespace, params.description, params.arguments);

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

        const script = {
          name: params.namespace,
          description: params.description,
          arguments: params.arguments,
          code: index
        };
        context.scripts.addScript(params.namespace, script);
  
        const argsStr = JSON.stringify(params, null, 2);
        
        return ResultOk([
          BasicAgentChatMessage.ok(
            "system",
            `Created '${params.namespace}' script.`,
            `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
            `## Result\n\`\`\`\n${
            `Created the following scripts:` + 
            `\n--------------\n` + 
            `Namespace: ${script.name}\nArguments: ${script.arguments}\nDescription: ${script.description}` +
            `\n--------------\n`
            }\n\`\`\``
          )
        ]);
      };
    }
  };
};
