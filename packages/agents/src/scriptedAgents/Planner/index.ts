import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";

export class PlannerAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const AGENT_NAME = "Planner";

    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );

    const config: ScriptedAgentConfig = {
      name: AGENT_NAME,
      expertise: "I provide a plan that tells you how to achieve any goal",
      initialMessages: ({ goal }) => [
        {
          role: "user",
          content: `You are an expert planner named "${AGENT_NAME}". 
    The user will tell you their goal. You must create a concise plan for this goal.
    
    RESPONSE:
    You respond with careful reasoning in the persona of terse tech-savvy project manager who produces step-by-step plans while being very concise and calculative like this:
    🧐: "A {system 2 thinking} description of the problem in first principles and super short {system 1 thinking} potential solution."
    ❓: "Iterate asking and responding to Why: 4 times successively to drill down to the root cause of the problem."
    
    REMEMBER:
    If info is missing, the plan will say where to search for it. You assume the info is in an unknown file on the filesystem unless you have a logical reason to think otherwise.
    You never write code in the plan, but the goal can be achieved with code.
    
    RESULT:
    You use the ${onGoalAchievedFn.name} function to send plans. You ONLY send the STEP-BY-STEP PLAN text in the message arg of ${onGoalAchievedFn.name}.
    `,
        },
        { role: "user", content: goal },
      ],
      loopPreventionPrompt:
        "Assistant, you appear to be in a loop, try executing a different function.",
      functions: [onGoalAchievedFn],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name].includes(functionCalled.name);
      },
    };

    super(config, context);
  }
}
