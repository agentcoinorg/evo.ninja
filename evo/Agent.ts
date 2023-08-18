import { Chat } from "../chat";
import { OpenAI } from "../openai";
import { WrapClient } from "../wrap";
import { RunResult, StepOutput, Workspace, env, executeFunc, loop } from "..";
import { LlmApi } from "../llm";

export class Agent {
  public chat: Chat;
  private llm: LlmApi;

  private client: WrapClient;
  private globals: Record<string, any> = {};

  constructor(private readonly workspace: Workspace) {

  }

  public async* run(goal: string): AsyncGenerator<StepOutput, RunResult, string | undefined> {
    try {
      return yield* loop(goal);
    } catch (err) {
      console.error(err);
      return RunResult.error("Unrecoverable error encountered.");
    }
  }
}
