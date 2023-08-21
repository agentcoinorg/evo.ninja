import { loop } from "./loop";
import { agentFunctions } from "./agent-functions";
import { RunResult, StepOutput, Agent } from "../agent";
import { executeAgentFunction } from "../agent-function";
import { ScriptWriter } from "../script-writer";
import { LlmApi, Chat } from "../../llm";
import { WrapClient } from "../../wrap";
import { Scripts } from "../../Scripts";
import { InMemoryWorkspace, Workspace } from "../../sys";

export class Evo implements Agent {
  private client: WrapClient;
  private globals: Record<string, any> = {};

  constructor(
    private readonly workspace: Workspace,
    private readonly scripts: Scripts,
    private readonly llm: LlmApi,
    private readonly chat: Chat
  ) {
    this.client = new WrapClient(
      this.workspace,
    );

    this.globals = {};
  }

  public async* run(goal: string): AsyncGenerator<StepOutput, RunResult, string | undefined> {
    const createScriptWriter = (): ScriptWriter => {
      const workspace = new InMemoryWorkspace();
      const chat = new Chat(workspace, this.llm);
      return new ScriptWriter(workspace, this.scripts, this.llm, chat);
    };

    try {
      return yield* loop(
        goal,
        this.llm,
        this.chat,
        this.client,
        this.globals,
        this.workspace,
        this.scripts,
        executeAgentFunction,
        agentFunctions(createScriptWriter)
      );
    } catch (err) {
      console.error(err);
      return RunResult.error("Unrecoverable error encountered.");
    }
  }
}
