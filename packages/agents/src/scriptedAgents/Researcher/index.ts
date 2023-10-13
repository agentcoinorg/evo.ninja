import { WriteFileFunction } from "../../functions/WriteFile";
import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ResearchPlannerAgent } from "../ResearchPlanner";
import { DelegateAgentFunction } from "../../functions/DelegateScriptedAgent";
import { Chat } from "@evo-ninja/agent-utils";
import { ScraperAgent } from "../Scraper";
import { ResearchVerifierAgent } from "../ResearchVerifier";

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

1. Start by delegating planning to the ResearchPlanner agent. You will received a detailed multi-step searching plan.
2. For each step, you will use the Scraper agent to search the web for results.
3. Before calling the ${onGoalAchievedFn.name} function, verify the result with the ResearchVerifier, giving it the information you think is complete.
If the research verifier says the data is incomplete, search for the missing data. If you have already used the verifier once and found new information, even if incomplete,
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
        new DelegateAgentFunction(
          () => new ResearchPlannerAgent({
            ...context,
            chat: new Chat(context.chat.tokenizer, context.chat.contextWindow)
          }),
        ),
        new DelegateAgentFunction(
          () => new ScraperAgent({
            ...context,
            chat: new Chat(context.chat.tokenizer, context.chat.contextWindow)
          })
        ),
        new DelegateAgentFunction(
          () => new ResearchVerifierAgent({
            ...context,
            chat: new Chat(context.chat.tokenizer, context.chat.contextWindow)
          }),
        ),
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
