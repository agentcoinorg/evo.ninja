import { loop } from "./loop";
import { agentFunctions } from "./agent-functions";
import { RunResult, StepOutput, Agent } from "../agent";
import { executeAgentFunction } from "../agent-function";
import { ScriptWriter } from "../script-writer";
import { LlmApi, Chat } from "../../llm";
import { WrapClient } from "../../wrap";
import { Scripts } from "../../Scripts";
import { InMemoryWorkspace, Workspace, Logger } from "../../sys";
import { IWrapPackage } from "@polywrap/client-js";
import { ResultErr } from "@polywrap/result";

export class Evo implements Agent {
  private client: WrapClient;
  private globals: Record<string, any> = {};

  constructor(
    private readonly workspace: Workspace,
    private readonly scripts: Scripts,
    private readonly llm: LlmApi,
    private readonly chat: Chat,
    private readonly logger: Logger,
    private readonly agentPackage: IWrapPackage,
    private readonly timeout?: {
      seconds?: number,
      callback: () => void
    },
  ) {
    this.client = new WrapClient(
      this.workspace,
      this.logger,
      this.agentPackage
    );

    this.globals = {};
  }

  public async* run(goal: string): AsyncGenerator<StepOutput, RunResult, string | undefined> {
    const createScriptWriter = (): ScriptWriter => {
      const workspace = new InMemoryWorkspace();
      const chat = new Chat(workspace, this.llm, this.chat.tokenizer, this.logger);
      return new ScriptWriter(workspace, this.scripts, this.llm, chat, this.logger);
    };

    if (this.timeout) {
      const defaultTimeout = 20 * 60 * 1000;
      const timeout = this.timeout.seconds ? this.timeout.seconds * 1000 : defaultTimeout;
      setTimeout(this.timeout.callback, timeout);
    }

    try {
      return yield* loop(
        goal,
        this.llm,
        this.chat,
        this.client,
        this.globals,
        this.workspace,
        this.scripts,
        this.logger,
        executeAgentFunction,
        agentFunctions(createScriptWriter)
      );
    } catch (err) {
      this.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}
