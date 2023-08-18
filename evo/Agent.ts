import { Chat } from "../chat";
import { OpenAI } from "../openai";
import { WrapClient } from "../wrap";
import { RunResult, StepOutput, Workspace, env, executeFunc, functions } from "..";
import { LlmApi } from "../llm";
import { loop } from "./loop";

export class Agent {
  public chat: Chat;
  private llm: LlmApi;

  private client: WrapClient;
  private globals: Record<string, any> = {};

  constructor(private readonly workspace: Workspace) {
    this.llm = new OpenAI(
      env().OPENAI_API_KEY,
      env().GPT_MODEL
    );
  
    this.chat = new Chat(
      env().CONTEXT_WINDOW_TOKENS,
      this.workspace,
      this.llm as OpenAI
    );
  
    this.client = new WrapClient(
      this.workspace,
    );
  
    this.globals = {};
  }

  public async* run(goal: string): AsyncGenerator<StepOutput, RunResult, string | undefined> {
    try {
      return yield* loop(goal, this.llm, this.chat, this.client, this.globals, this.workspace, executeFunc, functions);
    } catch (err) {
      console.error(err);
      return RunResult.error("Unrecoverable error encountered.");
    }
  }
}
