import { AgentBaseConfig, ScriptedAgentContext, ScriptedAgentConfig, ScriptedAgent } from "../..";
import { OnGoalAchievedFunction } from "../../scriptedAgents/functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../scriptedAgents/functions/OnGoalFailed";
import { DelegateAgentFunction } from "./functions/DelegateScriptedAgent";
import { SCRIPTER_AGENT_CONFIG, Scripter } from "../Scripter";

import { Chat } from "@evo-ninja/agent-utils";

export interface EvoRunArgs {
  goal: string
}

export interface EvoContext extends ScriptedAgentContext {
  globals: Record<string, string>;
}

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalFailedFunction();

const AGENT_NAME = "Evo";

export const EVO_AGENT_CONFIG = (scriptedAgents?: ScriptedAgentConfig[]): AgentBaseConfig<EvoRunArgs, EvoContext> => {
  const config: AgentBaseConfig<EvoRunArgs, EvoContext> = {
    name: AGENT_NAME,
    expertise: "an expert evolving assistant that achieves user goals",
    initialMessages: ({ goal }) => [
      {
        role: "assistant",
        content:
`Purpose:
I am an expert assistant designed to achieve user goals.

Functionalities:
I have multiple agents I can delegate a task to by calling the relevant delegate{Agent} functions.

Decision-making Process:
I always start by asking the Planner agent to make a step-by-step plan for how to achieve the goal.
I then evaluate the goal and see if it can be achieved without delegating to an agent.
Then, I see which agents have the most relevant expertise to the user's goal.
I then delegate tasks to the relevant agents until I am certain the goal has been achieved.
If I get stuck or encounter an error, I ask the Planner agent to make a revised plan and provide it with the all relevant information (including the original goal, what I have already done, and the problems I encountered).
A goal is only failed if I have exhausted all options and I am certain it cannot be achieved.
If a goal has been achieved or failed, I will call the agent_onGoalAchieved or agent_onGoalFailed function.

User Engagement:
I do not communicate with the user. I execute goals to the best of my abilities without any user input. I terminate when a goal has been achieved or failed.`
      },
      {
        role: "user",
        content: goal
      }
    ],
    loopPreventionPrompt: "Assistant, you seem to be looping. Try delegating a task or calling agent_onGoalAchieved or agent_onGoalFailed",
    functions: [
      onGoalAchievedFn,
      onGoalFailedFn,
      new DelegateAgentFunction(
        SCRIPTER_AGENT_CONFIG,
        (context) => new Scripter(
          context.llm,
          new Chat(context.chat.tokenizer, context.chat.contextWindow),
          context.logger,
          context.workspace,
          context.scripts,
          context.env
        )
      )
    ],
    shouldTerminate: (functionCalled) => {
      return [
        onGoalAchievedFn.name,
        onGoalFailedFn.name,
      ].includes(functionCalled.name);
    },
  };

  for (const scriptedAgent of scriptedAgents || []) {
    config.functions.push(new DelegateAgentFunction(
      scriptedAgent,
      (context) => new ScriptedAgent(
        scriptedAgent, {
          ...context,
          chat: new Chat(context.chat.tokenizer, context.chat.contextWindow)
        }
      )
    ));
  }

  return config;
}
