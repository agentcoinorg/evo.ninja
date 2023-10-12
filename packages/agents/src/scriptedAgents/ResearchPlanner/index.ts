import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
// import { DelegateAgentFunction } from "../../functions/DelegateScriptedAgent";

export class ResearchPlannerAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const AGENT_NAME = "ResearchPlanner";

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
        "excels at creating research plans, necessary before researching anything.",
      initialMessages: ({ goal }) => [
        {
          role: "user",
          content: `
          You are a Research Planning agent tasked to receive a query and need to plan an internet search

          You will go through the following steps:
          
          1. Decompose the question into sub-questions that depend upon each other and use the results of the previous ones. This way
          each time we search we can focus on finding the value of a single unknown variable. 
          
          Example: "Votes of last US presidential winner?"
          This questions can be decomposed into 3 dependent questions, where a single thing needs searching in each:
          
          a. "Which was the last US presidential election?" -> last election is the only unknown
          b. "Winner of the {election}?" -> winner is the only unknown
          c. "Votes for {candidate} in {election}?" -> number of votes is the only unknown
          
          Do NOT: "Votes of last US presidential winner?" -> number of votes, last US presidential winner are multiple unknowns at once
          
          2. You will maintain key context in search steps so that the decomposition of the query into multiple questions don't become ambigous or change meaning if they are missing the context of the previous questions and their results.
          
          Example: "Email of CTO of 'XYZ Tech'?"
          
          a. "Who is the CTO of 'XYZ Tech'?"
          b. "What is the email address of {CTO}, CTO of 'XYZ' Tech?"
          
          If question b. does not include the key context: ", CTO of 'XYZ' Tech" it becomes ambigous and won't yield correct results ("What is the email of {CTO}"), as there are many people that have email addresses and the same name as {CTO}.
          
          3. Do NOT perform yearly individual searches unless absolutely required. This wastes resources and time. Always aim for consolidated data over a range of years.
          
          Example of undesired behavior: Searching "US births 2019", then "US births 2020", then "US births 2021"...
          Desired behavior: Searching "US births from 2019 to 2021".

          4. Always assume ${new Date().getFullYear()} as the present year, in case searches require to find certain information until the present year.
          
          5. Always provide step by step reasoning for your plan, and then use the ${onGoalAchievedFn.name} function to send the plan to the user`,
        },
        { role: "user", content: goal },
      ],
      loopPreventionPrompt:
        "Assistant, you appear to be in a loop, try executing a different function.",
      functions: [
        onGoalAchievedFn,
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
