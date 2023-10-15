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

interface PlanResearchFuncParameters {
  query: string;
}

export class PlanResearchFunction extends AgentFunctionBase<PlanResearchFuncParameters> {
  constructor(private _llm: LlmApi, private _tokenizer: Tokenizer) {
    super();
  }

  get name(): string {
    return "plan_research";
  }
  get description(): string {
    return `Plans the research for a given query.`;
  }
  get parameters() {
    return {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Query to plan the research for",
        },
      },
      required: ["query"],
      additionalProperties: false,
    };
  }

  buildExecutor(
    _: Agent<unknown>,
    context: AgentBaseContext
  ): (
    params: PlanResearchFuncParameters,
    rawParams?: string
  ) => Promise<AgentFunctionResult> {
    return async (
      params: PlanResearchFuncParameters,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      try {
        const prompt = this.getPlanningPrompt(params.query);
        const chatLogs = new ChatLogs({
          "persistent": {
            tokens: this._tokenizer.encode(prompt).length,
            msgs: [{
              role: "user",
              content: prompt
            }]
          },
          "temporary": {
            tokens: 0,
            msgs: []
          }
        });

        const response = await this._llm.getResponse(chatLogs, undefined)

        if (!response || !response.content) {
          throw new Error("Failed to plan research: No response from LLM");
        }
  
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
    params: PlanResearchFuncParameters,
    result: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Plan research for '${params.query}'`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Found the following result for the web search: '${params.query}'` +
              `\n--------------\n` +
              `${result}\n` +
              `\n--------------\n`
          ),
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Research plan: '${params.query}'` +
            `${result}\n` +
            `\`\`\``,
          variables
        ),
      ],
    };
  }

  private onError(
    params: PlanResearchFuncParameters,
    error: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Plan research for '${params.query}'`,
          content: FUNCTION_CALL_FAILED(
            params,
            this.name,
            error
          ),
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Error planning research for '${params.query}'\n` + 
          `\`\`\`\n` +
          `${trimText(error, 300)}\n` +
          `\`\`\``,
          variables
        ),
      ],
    };
  }

  private getPlanningPrompt(query: string): string {
    return `You are a Research Planning agent tasked to receive a query and need to plan an internet search

    You will go through the following steps:
    
    1. Decompose the question into sub-questions that depend upon each other and use the results of the previous ones. This way
    each time we search we can focus on finding the value of a single unknown variable. 
    
    Example: "Votes of last US presidential winner?"
    This questions can be decomposed into 3 dependent questions, where a single thing needs searching in each:
    
    a. "Which was the last US presidential election?" -> last election is the only unknown
    b. "Winner of the {election}?" -> winner is the only unknown
    c. "Votes for {candidate} in {election}?" -> number of votes is the only unknown
    
    Do NOT: "Votes of last US presidential winner?" -> number of votes, last US presidential winner are multiple unknowns at once
    
    If you can't decompose the question into sub-questions, because a single search would suffice, return the query as is, intact.

    2. You will maintain key context in search steps so that the decomposition of the query into multiple questions don't become ambigous or change meaning if they are missing the context of the previous questions and their results.
    
    Example: "Email of CTO of 'XYZ Tech'?"
    
    a. "Who is the CTO of 'XYZ Tech'?"
    b. "What is the email address of {CTO}, CTO of 'XYZ' Tech?"
    
    If question b. does not include the key context: ", CTO of 'XYZ' Tech" it becomes ambigous and won't yield correct results ("What is the email of {CTO}"), as there are many people that have email addresses and the same name as {CTO}.
    
    3. Do NOT perform yearly individual searches unless absolutely required. This wastes resources and time. Always aim for consolidated data over a range of years.
    
    Example of undesired behavior: Searching "US births 2019", then "US births 2020", then "US births 2021"...
    Desired behavior: Searching "US births from 2019 to 2021".

    4. Always assume ${new Date().getFullYear()} as the present year, in case searches require to find certain information until the present year.
    
    5. Always provide step by step reasoning for your plan,
    
    6. Be precise, and concise.
    
    Here's the query you need to plan: ${query}`;
  }
}
