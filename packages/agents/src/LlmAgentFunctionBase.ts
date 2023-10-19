import { LlmApi, Tokenizer, LlmQueryBuilder, AgentOutput, Agent } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "./AgentFunctionBase";
import { Result, ResultErr, ResultOk } from "@polywrap/result";
import { AgentBaseContext } from "./AgentBase";

export abstract class LlmAgentFunctionBase<TParams> extends AgentFunctionBase<TParams> {
  constructor(protected llm: LlmApi, protected tokenizer: Tokenizer) {
    super();
  }

  protected queryBuilder(): LlmQueryBuilder {
    return new LlmQueryBuilder(this.llm, this.tokenizer);
  }

  protected askLlm(question: string): Promise<string> {
    return this.queryBuilder()
      .persistent("user", question)
      .build()
      .content();
  }

  protected async askAgent<TRunArgs>(agent: Agent<TRunArgs>, runArgs: TRunArgs, context: AgentBaseContext): Promise<Result<AgentOutput, string | undefined>> {
    const result = await runAgent(agent, runArgs, context);

    if (!result.ok) {
      return ResultErr(result.error);
    }

    const [output] = result.value;

    return ResultOk(output);
  }

  protected async talkWithAgent<TRunArgs>(agent: Agent<TRunArgs>, runArgs: TRunArgs, context: AgentBaseContext): Promise<Result<AgentOutput, string | undefined>> {
    const result = await runAgent(agent, runArgs, context);

    if (!result.ok) {
      return ResultErr(result.error);
    }

    const [output, messages] = result.value;
    
    for (const message of messages) {
      context.chat.add("temporary", {
        role: "assistant",
        content: message
      });
    }

    return ResultOk(output);
  }
}

const runAgent = async <TRunArgs>(agent: Agent<TRunArgs>, runArgs: TRunArgs, context: AgentBaseContext): Promise<Result<[AgentOutput, string[]], string | undefined>> => {
  let iterator = agent.run(runArgs);

  const messages = [];

  while (true) {
    const response = await iterator.next();

    if (response.done) {
      if (!response.value.ok) {
        return ResultErr(response.value.error);
      }
    
      return ResultOk([response.value.value, messages]);
    } else {
      if (response.value.type === "message" && response.value.content) {
        messages.push(response.value.content);
      }
    }

    response.value && context.logger.info(response.value.title);
  }
}
