import { loop } from "./loop";
import { agentFunctions } from "./agent-functions";
import { RunResult, StepOutput, Agent } from "../agent";
import { executeAgentFunction } from "../agent-function";
import { ScriptWriter } from "../script-writer";
import { LlmApi, Chat } from "../../llm";
import { WrapClient } from "../../wrap";
import { Scripts } from "../../Scripts";
import { InMemoryWorkspace, Workspace, Logger } from "../../sys";
import { IWrapPackage, Uri } from "@polywrap/client-js";
import { ResultErr } from "@polywrap/result";

export class Evo implements Agent {
  private client: WrapClient;
  private globals: Record<string, any> = {};
  private timeout = 1_200_000; // Default to 20 minutes in milliseconds

  constructor(
    private readonly workspace: Workspace,
    private readonly scripts: Scripts,
    private readonly llm: LlmApi,
    private readonly chat: Chat,
    private readonly logger: Logger,
    private readonly agentPackage: IWrapPackage
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

    setTimeout(async () => {
      const wrapper = await this.agentPackage.createWrapper();
      if (wrapper.ok) {
        wrapper.value.invoke(
          { method: "onTimeout", uri: Uri.from("plugin/agent") },
          this.client
        );
      }
    }, this.timeout);

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

  public setTimeout(time: number) {
    this.timeout = time;
  }
}
