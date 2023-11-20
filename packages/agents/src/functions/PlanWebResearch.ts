import {
  AgentFunctionResult,
  AgentOutputType,
  AgentVariables,
  ChatMessageBuilder,
  LlmApi,
  Tokenizer,
  trimText,
} from "@/agent-core";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { LlmAgentFunctionBase } from "./utils";
import { Agent } from "../agents/utils";

interface PlanWebResearchFuncParameters {
  goal: string;
}

export class PlanWebResearchFunction extends LlmAgentFunctionBase<PlanWebResearchFuncParameters> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }

  name: string = "plan_webResearch";
  description: string = `Plans how to research on the internet for a given user goal.`;
  parameters: any = {
    type: "object",
    properties: {
      goal: {
        type: "string",
        description: "The user's goal",
      },
    },
    required: ["goal"],
    additionalProperties: false,
  };

  buildExecutor({ context }: Agent<unknown>): (
    params: PlanWebResearchFuncParameters,
    rawParams?: string
  ) => Promise<AgentFunctionResult> {
    return async (
      params: PlanWebResearchFuncParameters,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      try {

        const getPlan = this.askLlm(
          this.getPlanningPrompt(params.goal),
          { model: "gpt-3.5-turbo-16k", maxResponseTokens: 200 }
        );

        const getFormatting = this.askLlm(
          this.getFormattingPrompt(params.goal),
          { model: "gpt-3.5-turbo-16k", maxResponseTokens: 200 }
        );

        const [plan, formatting] = await Promise.all(
          [getPlan, getFormatting]
        );

        return this.onSuccess(
          params,
          plan,
          formatting,
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
    params: PlanWebResearchFuncParameters,
    plan: string,
    formatting: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Plan research for '${params.goal}'`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Research Plan:` +
              `\n--------------\n` +
              plan +
              `\n--------------\n` +
              `Formatting Requirements:` +
              `\n--------------\n` +
              formatting +
              `\n--------------\n`
          ),
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Research Plan:` +
            `\n\`\`\`\n` +
            plan +
            `\n\`\`\`\n` +
            `Formatting Requirements:` +
            `\n\`\`\`\n` +
            formatting +
            `\n\`\`\`\n`
        ),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Formatting Requirements:` +
            `\n\`\`\`\n` +
            formatting +
            `\n\`\`\`\n`
        ),
      ],
    };
  }

  private onError(
    params: PlanWebResearchFuncParameters,
    error: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Plan research for '${params.goal}'`,
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
          `Error planning research for '${params.goal}'\n` + 
          `\`\`\`\n` +
          `${trimText(error, 300)}\n` +
          `\`\`\``
        ),
      ],
    };
  }

  private getPlanningPrompt(goal: string): string {
    return `1. **Break Down the Question**: 
       - Divide big questions into smaller, related parts.
       - Example: Instead of "Votes of last US presidential winner?", ask:
         a. "When was the last US presidential election?"
         b. "Who won that election?"
         c. "How many votes did the winner get?"
       - If one search is enough, leave the question as is.

    2. **Keep Important Details**:
       - When asking follow-up questions, always include important details from previous questions.
       - Example: For "Email of CTO of 'XYZ Tech'?", ask:
         a. "Who's the CTO of 'XYZ Tech'?"
         b. "What's {CTO}'s email at 'XYZ Tech'?"
    
    3. **Avoid Year-by-Year Searches**:
       - Don't search for each year individually. Look for grouped data.
       - Instead of searching "US births 2019", "US births 2020", etc., ask for "US births from 2019 to 2021".
    
    4. **Use Current Year**:
       - If you need the current year in a search, use ${new Date().getFullYear()}.
    
    5. **Explain Your Steps**:
       - Tell us how you came up with your plan.
    
    6. **Be Clear and Brief**:
       - Aim for accuracy and keep it short.
       
    Here's the query you need to plan: ${goal}`;
    /*return `You are a Research Planning agent tasked to receive a query and need to plan an internet search

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

    Here's the query you need to plan: ${goal}`;*/
  }

  private getFormattingPrompt(goal: string): string {
    return `Given the following user goal, please identify any formatting requirements: ${goal}`;
  }
}
