import { ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, BasicAgentChatMessage } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { READ_GLOBAL_VAR_OUTPUT } from "../prompts";

const FN_NAME = "readVar";
type FuncParameters = { 
  name: string 
};

export const readVar: AgentFunction<AgentContext> = {
  definition: {
    name: "readVar",
    description: `Read the content of a stored global variable.`,
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the variable"
        }
      },
      required: ["name"],
      additionalProperties: false
    },
  },
  buildExecutor(context: AgentContext) {
    return async (params: FuncParameters): Promise<AgentFunctionResult> => {
      const argsStr = JSON.stringify(params, null, 2);
     
      if (!context.globals[params.name]) {
        return ResultOk([
          BasicAgentChatMessage.error("system", `Failed to read ${params.name} variable!`, 
          `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
          READ_GLOBAL_VAR_OUTPUT(params.name, `Global variable ${params.name} not found.`))
        ]);
      } 

      return ResultOk([
        BasicAgentChatMessage.ok(
          "system",
          `Read '${params.name}' variable.`,
          `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
          `## Result\n\`\`\`\n${
            context.globals[params.name]
          }\n\`\`\``
        )
      ]);
    };
  }
};
