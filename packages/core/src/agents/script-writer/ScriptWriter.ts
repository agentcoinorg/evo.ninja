import { loop } from "./loop";
import { agentFunctions } from "./agent-functions";
import { RunResult, StepOutput, Agent } from "../agent";
import { executeAgentFunction } from "../agent-function";
import { WrapClient } from "../../wrap";
import { Scripts } from "../../Scripts";
import { LlmApi, Chat } from "../../llm";
import { Workspace, Logger } from "../../sys";
import { ResultErr } from "@polywrap/result";

export class ScriptWriter implements Agent {
  private client: WrapClient;
  private globals: Record<string, any> = {};

  constructor(
    public readonly workspace: Workspace,
    private readonly scripts: Scripts,
    private readonly llm: LlmApi,
    private readonly chat: Chat,
    private readonly logger: Logger
  ) {
    this.client = new WrapClient(
      this.workspace,
      this.logger,
    );
    
    this.globals = {};
  }

  public async* run(
    namespace: string, 
    description: string,
    args: string,
  ): AsyncGenerator<StepOutput, RunResult, string | undefined> {
    try {
      return yield* loop(
        namespace, 
        description, 
        args, 
        this.llm, 
        this.chat, 
        this.client, 
        this.globals,
        this.workspace,
        this.scripts,
        this.logger,
        executeAgentFunction,
        agentFunctions
      );
    } catch (err) {
      this.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}
