import { AgentBaseConfig, ScriptedAgentContext, ScriptedAgentConfig, ScriptedAgent } from "../..";
import { DelegateAgentFunction } from "./functions/DelegateScriptedAgent";
import { SCRIPTER_AGENT_CONFIG, Scripter } from "../Scripter";
import { OnGoalAchievedFunction } from "../../scriptedAgents/functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../scriptedAgents/functions/OnGoalFailed";

import { Chat } from "@evo-ninja/agent-utils";
import { VerifyGoalAchievedFunction } from "./functions/VerifyGoalAchieved";

export interface EvoRunArgs {
  goal: string
}

export interface EvoContext extends ScriptedAgentContext {
  globals: Record<string, string>;
}

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalFailedFunction();
const verifyGoalAchieved = new VerifyGoalAchievedFunction();

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
Since the agents do not see user messages, it is cruical you pass all the required information to the agents. Do not leave out relevant context from the user.

Decision-making Process:
1. Evaluate the goal, see if it can be achieved without delegating to another agent.
2. Sub-tasks are delegated to agents that have the most relevant expertise.
3. When you are certain a goal and its sub-tasks have been achieved, you will call ${verifyGoalAchieved.name}.
4. If you get stuck or encounter an error, think carefully and create a new plan considering the problems you've encountered.
5. A goal is only failed if you have exhausted all options and you are certain it cannot be achieved. Call ${onGoalFailedFn.name} with information as to what happened.

REMEMBER:
If info is missing, you assume the info is somewhere on the user's computer like the filesystem, unless you have a logical reason to think otherwise.
Do not communicate with the user.`
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
      verifyGoalAchieved,
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
