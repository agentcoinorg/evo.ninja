import { LlmApi, Chat, Workspace, Scripts, Env, WrapClient, agentPlugin, Logger, Timeout, AgentOutput, RunResult, basicFunctionCallLoop } from "@evo-ninja/agent-utils";
import { EVO_AGENT_CONFIG, EvoContext, EvoRunArgs } from "./config";
import { AgentBase } from "../../AgentBase";
import {
  ScriptedAgentConfig,
  DEVELOPER_AGENT_CONFIG,
  RESEARCHER_AGENT_CONFIG,
  DATA_ANALYST_AGENT
} from "../../scriptedAgents";
import { ResultErr } from "@polywrap/result";

export const defaultScriptedAgents = [
  DEVELOPER_AGENT_CONFIG,
  RESEARCHER_AGENT_CONFIG,
  DATA_ANALYST_AGENT
];

export class Evo extends AgentBase<EvoRunArgs, EvoContext> {
  constructor(
    llm: LlmApi,
    chat: Chat,
    logger: Logger,
    workspace: Workspace,
    scripts: Scripts,
    env: Env,
    timeout?: Timeout,
    scriptedAgents?: ScriptedAgentConfig[],
  ) {
    const context = {
      llm,
      chat,
      workspace,
      scripts,
      logger,
      globals: {},
      client: new WrapClient(
        workspace,
        logger,
        agentPlugin({ logger }),
        env
      ),
      env
    };

    super({
      ...EVO_AGENT_CONFIG(scriptedAgents || defaultScriptedAgents),
      timeout
    }, context);
  }

  public async *runWithChat(args: {
    chat: Chat;
  }): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    this.context.chat = args.chat;
    if (this.config.timeout) {
      setTimeout(
        this.config.timeout.callback,
        this.config.timeout.milliseconds
      );
    }
    try {
      return yield* basicFunctionCallLoop(
        this.context,
        this.config.functions.map((fn) => {
          return {
            definition: fn.getDefinition(),
            buildExecutor: (context: EvoContext) => {
              return fn.buildExecutor(this, context);
            },
          };
        }),
        (functionCalled) => {
          return this.config.shouldTerminate(functionCalled);
        },
        this.config.loopPreventionPrompt,
        this.config.agentSpeakPrompt
      );
    } catch (err) {
      this.context.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}
