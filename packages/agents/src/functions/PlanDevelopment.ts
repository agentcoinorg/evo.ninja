import {
  Agent,
  AgentFunctionResult,
  AgentOutputType,
  AgentVariables,
  ChatLogs,
  ChatMessageBuilder,
  LlmApi,
  Tokenizer,
  trimText,
} from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";

interface PlanDevelopmentFuncParameters {
  query: string;
}

export class PlanDevelopmentFunction extends AgentFunctionBase<PlanDevelopmentFuncParameters> {
  constructor(private _llm: LlmApi, private _tokenizer: Tokenizer) {
    super();
  }

  name: string = "plan_development";
  description: string = `Plans the development for a given query.`;
  parameters: any = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Query to plan the development for",
      },
    },
    required: ["query"],
    additionalProperties: false,
  };

  buildExecutor(
    _: Agent<unknown>,
    context: AgentBaseContext
  ): (
    params: PlanDevelopmentFuncParameters,
    rawParams?: string
  ) => Promise<AgentFunctionResult> {
    return async (
      params: PlanDevelopmentFuncParameters,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      try {
        const files = context.workspace.readdirSync("/");
        const textFiles = files
          .filter((f) => !f.name.includes("test") && !f.name.startsWith("."));

        const textFileContents = textFiles.map((f) => `

        File: ${f.name}
        Content: ${context.workspace.readFileSync(f.name)}
        
        `)
        textFiles.forEach(f => {
          const text = context.workspace.readFileSync(f.name)
          const tokens = context.chat.tokenizer.encode(text)

          console.log({
            name: f.name,
            tokens: tokens.length,
            textLength: text.length,
          })
        })

        const chatLogs = ChatLogs.from([{
          role: "user",
          content: this.getPlanningPrompt(params.query, `Files in workspace to consider: \n\n${textFileContents.join("\n")}`)
        }], [], this._tokenizer);

        const response = await this._llm.getResponse(chatLogs)

        if (!response || !response.content) {
          throw new Error("Failed to plan development: No response from LLM");
        }

        console.log(response.content)
  
        return this.onSuccess(
          params,
          response.content,
          rawParams,
          context.variables
        );
      } catch (err) {
        return this.onError(
          params,
          err.toString(),
          rawParams,
          context.variables
        );
      }
    };
  }

  private onSuccess(
    params: PlanDevelopmentFuncParameters,
    result: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Plan development for '${params.query}'`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Development plan:` +
              `\n--------------\n` +
              `${result}\n` +
              `\n--------------\n`
          ),
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.name,
          `Development plan:` +
          `\n--------------\n` +
          `${result}\n` +
          `\n--------------\n`,
          variables
        ),
      ],
    };
  }

  private onError(
    params: PlanDevelopmentFuncParameters,
    error: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Plan development`,
          content: FUNCTION_CALL_FAILED(
            params,
            this.name,
            error
          ),
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.name,
          `Error planning development\n` + 
          `\`\`\`\n` +
          `${trimText(error, 300)}\n` +
          `\`\`\``,
          variables
        ),
      ],
    };
  }

  private getPlanningPrompt(query: string, context: string): string {
    return `You are a Development Planning agent tasked to receive a query and need to plan the development for it in steps.
    All development will be done in Python and without using any external libraries. Consider the context to answer the query
    as it contains specific information about the project you are working on.

    Do NOT include any development that's not specifically asked for or needed to answer the query.
    
    Context: ${context}
    -------------------------------
    Query: ${query}`;
  }
}
