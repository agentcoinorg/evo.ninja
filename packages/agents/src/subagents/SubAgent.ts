import { AgentBase } from "../AgentBase";
import { AgentBaseContext } from "../AgentBase";

import { Scripts, WrapClient, ChatRole, agentPlugin, ExecuteAgentFunctionCalled } from "@evo-ninja/agent-utils";
import { SubAgentFunctionBase } from "./SubAgentFunction";

export interface SubAgentContext extends AgentBaseContext {
  scripts: Scripts;
  client: WrapClient;
}

export interface SubAgentConfig {
  name: string;
  expertise: string;
  initialMessages: (runArguments: SubAgentRunArgs) => { role: ChatRole; content: string }[];
  loopPreventionPrompt: string;
  shouldTerminate: (functionCalled: ExecuteAgentFunctionCalled) => boolean;
  functions: SubAgentFunctionBase<unknown>[];
}

export interface SubAgentRunArgs {
  goal: string;
}

export class SubAgent extends AgentBase<SubAgentRunArgs, SubAgentContext> {
  public readonly name: string;

  constructor(
    config: SubAgentConfig,
    context: SubAgentContext,
  ) {

    super(config, context);
    this.name = config.name;
  }

  public static create(
    config: SubAgentConfig,
    context: Omit<SubAgentContext, "client">
  ): SubAgent {
    return new SubAgent(config, {
      ...context,
      client: new WrapClient(
        context.workspace,
        context.logger,
        agentPlugin({ logger: context.logger }),
        context.env
      )
    });
  }
}
