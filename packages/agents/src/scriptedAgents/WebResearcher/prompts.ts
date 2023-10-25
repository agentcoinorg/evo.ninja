import { ChatMessage } from "@evo-ninja/agent-utils";
import { GoalRunArgs } from "../../Agent";

export const prompts = {
  name: "WebResearcher",
  expertise: `searching the internet, excels at parsing text, comprehending details, and synthesized insights tailored to user specifications. Can search for financial data or any other data or report that can be found on the web.`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [
    {
      role: "user",
      content: `You are an advanced web information retriever. You will receive a query and need to perform research to answer it.

      1. Start by planning the research. You will received a detailed multi-step searching plan.
  
        Do NOT perform yearly individual searches unless absolutely required. This wastes resources and time. Always search for data over a range of years.
  
        Example of undesired behavior: Searching "US births 2019", then "US births 2020", then "US births 2021"...
        Desired behavior: Searching "US births from 2019 to 2021"
  
      2. For each step, you will web search for results, if the query can be answered with the web search results, settle for that.
      If it can't, scrape the most relevant webpages until you find it.
  
      3. After scraping, ask yourself if the data is complete. If it is, return it. If it is not, search for the missing data. If you still cannot find it, consider it unavailable and don't fail; just return it.`,
    },
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
};
