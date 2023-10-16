import { WriteFileFunction } from "../../functions/WriteFile";
import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { HTMLChunker } from "@evo-ninja/agent-utils";
import { WebSearchFunction } from "../../functions/WebSearch";
import { SearchInPagesFunction } from "../../functions/SearchInPages";
import { PlanResearchFunction } from "../../functions/PlanResearch";
import { VerifyResearchFunction } from "../../functions/VerifyResearch";
import { OpenAIEmbeddingFunction, connect } from "vectordb";
import path from "path";

export class ResearcherAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const AGENT_NAME = "Researcher";

    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );

    const onGoalFailedFn = new OnGoalFailedFunction(
      context.client,
      context.scripts
    );

    const config: ScriptedAgentConfig = {
      name: AGENT_NAME,
      expertise:
        "excels at parsing text, comprehending details, and synthesized insights tailored to user specifications.",
      initialMessages: ({ goal }) => [
        {
          role: "user",
          content: `
You are an advanced web information retriever. You will receive a query and need to perform research to answer it.

1. Start by planning the research. You will received a detailed multi-step searching plan.
2. For each step, you will web search for results. If you find the answer to the query in the results, settle for that.
   If you don't find the answer, choose the URLs (A MAXIMUM OF 3) of the pages you think would contain relevant information and use search_in_pages. NEVER MORE THAN 3 URLs at once.

   Prioritize accuracy. Do not settle for the first piece of information found if there are more precise results available
   Example: "population of New York in 2020" and you get the following results: ["1.5 million",  "nearly 1.600.000", "1,611,989"], you will take "1,611,989"
   Make sure to thoroughly examine if you see more than one result, and choose the most accurate one, state it.
   Verify the research result, giving it the information you think is complete. Always communicate the original query to the verifier.
If the research verification says the data is incomplete, search for the missing data. If you have already used the verifier once and found new information, even if incomplete,
DO NOT FAIL, call the ${onGoalAchievedFn.name} function with what you have.
Use the verifier ONLY ONCE
`,
        },
        { role: "user", content: goal },
      ],
      loopPreventionPrompt:
        "Assistant, you appear to be in a loop, try executing a different function.",
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        new WriteFileFunction(context.client, context.scripts),
        new PlanResearchFunction(context.llm, context.chat.tokenizer),
        new VerifyResearchFunction(context.llm, context.chat.tokenizer),
        new SearchInPagesFunction(
          new HTMLChunker({ maxChunkSize: 5000 }),
          context.chat.tokenizer,
          context.llm,
          {
            connect: async () => connect({
              uri:  path.join(process.cwd(), "./db/lance"),
            }),
            embeddingFunction: (column) => new OpenAIEmbeddingFunction('text', context.env.OPENAI_API_KEY)
          }
        ),
        new WebSearchFunction(),
      ],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
          functionCalled.name
        );
      },
    };

    super(config, context);
  }
}
