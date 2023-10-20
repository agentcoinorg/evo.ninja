import {
  Timeout,
} from "@evo-ninja/agent-utils";
import { AgentContext } from "../../AgentContext";
import {
  DataAnalystAgent,
  DeveloperAgent,
  ResearcherAgent,
} from "../../scriptedAgents";
import { DelegateAgentFunction } from "../../functions/DelegateScriptedAgent";
import { VerifyGoalAchievedFunction } from "../../functions/VerifyGoalAchieved";
import { prompts } from "./prompts";
import { ScripterAgent } from "../Scripter";
import { Agent } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";

export type AgentOrFactory = (Agent | (() => Agent));

export class Evo extends Agent {
  constructor(
    context: AgentContext,
    timeout?: Timeout,
    delegatedAgents?: AgentOrFactory[]
  ) {
    const verifyGoalAchievedFn = new VerifyGoalAchievedFunction(context.llm, context.chat.tokenizer);

    delegatedAgents = delegatedAgents ?? [
        DeveloperAgent,
        ResearcherAgent,
        DataAnalystAgent,
        ScripterAgent
      ].map(agentClass => () => new agentClass(context.cloneEmpty()));

    super(
      new AgentConfig(
        (_, onGoalFailedFn) => prompts(verifyGoalAchievedFn, onGoalFailedFn),
        [
          verifyGoalAchievedFn,
          ...delegatedAgents.map((x) => new DelegateAgentFunction(x, context.llm, context.chat.tokenizer)),
        ],
        context.scripts,
        timeout
      ),
      context,
    );
  }
}
