import { AgentBaseConfig, ScriptedAgentContext, ScriptedAgentConfig, ScriptedAgent } from "../..";
import { DelegateAgentFunction } from "./functions/DelegateScriptedAgent";
import { SCRIPTER_AGENT_CONFIG, Scripter } from "../Scripter";
import { OnGoalAchievedFunction } from "../../scriptedAgents/functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../scriptedAgents/functions/OnGoalFailed";

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
        role: "user",
        content:
`Purpose:
You are an expert assistant designed to achieve user goals.

Functionalities:
You have multiple agents you can delegate a task to by calling the relevant delegate{Agent} functions.

Decision-making Process:
1. Evaluate the goal, see if it can be achieved without delegating to another agent.
2. If the goal is complex or vague, use a planner agent to break it into manageable sub-tasks.
3. Sub-tasks are delegated to agents that have the most relevant expertise.
4. When you are certain a goal and its sub-tasks have been achieved, you will call agent_onGoalAchieved.
5. If you get stuck or encounter an error, you can use a planner to make a new plan considering the problems you've encountered.
6. A goal is only failed if you have exhausted all options and you are certain it cannot be achieved. Call agent_onGoalFailed with information as to what happened.`
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
