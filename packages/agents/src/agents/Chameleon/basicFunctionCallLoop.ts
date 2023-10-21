import { Chat, AgentFunction, ExecuteAgentFunctionCalled, ExecuteAgentFunctionResult, AGENT_SPEAK_RESPONSE, AgentOutput, RunResult, processFunctionAndArgs, AgentOutputType, executeAgentFunction, ChatMessage, OpenAIEmbeddingAPI, LocalVectorDB, LlmQueryBuilderV2 } from "@evo-ninja/agent-utils";
import { ResultErr, ResultOk } from "@polywrap/result";
import { AgentContext } from "../../AgentContext";
import { DeveloperAgent, ResearcherAgent, DataAnalystAgent } from "../../scriptedAgents";
import { ScripterAgent } from "../Scripter";
import { Agent } from "../../Agent";
import { AgentFunctionBase } from "../../AgentFunctionBase";

const shortenLargeMessages = async (query: string, chat: Chat, context: AgentContext): Promise<void> => {
  for(let i = 2; i < chat.chatLogs.messages.length ; i++) {
    const message = chat.chatLogs.messages[i];
    if (message.content && message.content.length > 2000) {
      await shortenMessage(message, query, context);
    }
  }
};

const shortenMessage = async (message: ChatMessage, query: string, context: AgentContext): Promise<void> => {
    const result = await Rag.text(context)
      .chunks(TextChunker.multiLines(message.content ?? "", 10))
      .limit(50)
      .characterLimit(2000)
      .query(query);

    message.content = "...\n" + result.join("\n...\n");
};

export async function* basicFunctionCallLoop(
  context: AgentContext,
  funcs: AgentFunction<AgentContext>[],
  shouldTerminate: (
    functionCalled: ExecuteAgentFunctionCalled,
    result: ExecuteAgentFunctionResult["result"]
  ) => boolean,
  loopPreventionPrompt: string,
  agentSpeakPrompt: string = AGENT_SPEAK_RESPONSE
): AsyncGenerator<AgentOutput, RunResult, string | undefined>
{
  const { llm, chat } = context;
  const queryBuilder = (msgs?: ChatMessage[]) => new LlmQueryBuilderV2(context.llm, context.chat.tokenizer, msgs);
  const getQuery = (msg: ChatMessage) => queryBuilder([msg])
    .message("user", "What is the obove message trying to achieve?")
    .build()
    .content();

  while (true) {
    console.log("CHAT LOGS1.1", chat.chatLogs.messages.length);
    let query = "";
    if (chat.chatLogs.messages.length <= 2) {
      query = chat.chatLogs.messages[chat.chatLogs.messages.length - 1].content ?? "";
    } else {
      const lastMessage = chat.chatLogs.messages[chat.chatLogs.messages.length - 1];

      if (lastMessage.content && lastMessage.content.length > 2000) {
        console.log("CHAT LOGS1.1.1", chat.chatLogs.messages.length);

        const q = await getQuery(chat.chatLogs.messages[chat.chatLogs.messages.length - 2]);
        console.log("CHAT LOGS1.1.2", chat.chatLogs.messages.length);

        await shortenMessage(lastMessage, q, context);
      }
      console.log("CHAT LOGS1.1.3", chat.chatLogs.messages.length);

      query = await getQuery(lastMessage);
    }
    console.log("QUERY", query);
    console.log("QUERY.length", query.length);
    console.log("QUERY.tokens", chat.tokenizer.encode(query).length);
    console.log("CHAT LOGS1.2", chat.chatLogs.messages.length);

    await shortenLargeMessages(query, chat, context);
    console.log("CHAT LOGS1.3", chat.chatLogs.messages.length);

    const [agent, agentFunctions, persona, allFunctions] = await findBestAgent(query, context);
    console.log("CHAT LOGSX", chat.chatLogs.messages.length);

    const newLogs = chat.chatLogs.clone();
    newLogs.insert("persistent", {
      tokens: 0,
      msgs: [{
        role: "user",
        content: persona,
      } as ChatMessage],
    }, 0);


    console.log("CHAT LOGS2", newLogs.messages.length);

    const response = await llm.getResponse(newLogs, agentFunctions.map(f => f.definition));
    console.log("CHAT LOGS3", chat.chatLogs.messages.length);
    console.log("CHAT LOGS4", newLogs.messages.length);

    if (!response) {
      return ResultErr("No response from LLM.");
    }

    if (response.function_call) {
      const { name, arguments: args } = response.function_call;
      console.log("Function", name);

      const sanitizedFunctionAndArgs = processFunctionAndArgs(name, args, allFunctions.map((fn) => {
        return {
          definition: fn.getDefinition(),
          buildExecutor: (context: AgentContext) => {
            return fn.buildExecutor(agent);
          }
        }
      }), context.variables)
      if (!sanitizedFunctionAndArgs.ok) {
        chat.temporary(response);
        chat.temporary("system", sanitizedFunctionAndArgs.error);
        yield { type: AgentOutputType.Error, title: `Failed to sanitize function ${name} with args ${args}. Error: ${sanitizedFunctionAndArgs.error}`, content: sanitizedFunctionAndArgs.error } as AgentOutput;
        continue;
      }

      const { result, functionCalled } = await executeAgentFunction(sanitizedFunctionAndArgs.value, args, context)

      console.log("Function result", result.messages.length);
      console.log("CHAT LOGS5", chat.chatLogs.messages.length);
      result.messages.forEach(x => chat.temporary(x));
      console.log("CHAT LOGS6", chat.chatLogs.messages.length);
      const terminate = functionCalled && shouldTerminate(functionCalled, result);

      for (let i = 0; i < result.outputs.length; i++) {
        const output = result.outputs[i];

        if (i === result.outputs.length - 1 && terminate) {
          return ResultOk(output);
        }

        yield output;
      }

      console.log("CHAT LOGS7", chat.chatLogs.messages.length);
    } else {
      yield* _preventLoopAndSaveMsg(chat, response, loopPreventionPrompt, agentSpeakPrompt);
    }
  }
}

async function* _preventLoopAndSaveMsg(chat: Chat, response: ChatMessage, loopPreventionPrompt: string, agentSpeakPrompt: string): AsyncGenerator<AgentOutput, void, string | undefined> {
  if (chat.messages[chat.messages.length - 1].content === response.content &&
    chat.messages[chat.messages.length - 2].content === response.content) {
      chat.temporary("system", loopPreventionPrompt);
      yield {
        type: AgentOutputType.Warning,
        title: "Loop prevention",
        content: loopPreventionPrompt
      } as AgentOutput;
  } else {
    chat.temporary(response);
    chat.temporary("system", agentSpeakPrompt);
    yield {
      type: AgentOutputType.Message,
      title: "Agent message",
      content: response.content ?? ""
    } as AgentOutput;
  }
}

const findBestAgent = async (query: string, context: AgentContext): Promise<[Agent<unknown>, AgentFunction<AgentContext>[], string, AgentFunctionBase<unknown>[]]> => {
  const allAgents: Agent[] = [
    DeveloperAgent,
    ResearcherAgent,
    DataAnalystAgent,
    ScripterAgent
  ].map(agentClass => new agentClass(context.cloneEmpty()));

  const agentsWithPrompts = allAgents.map(agent => {
    return {
      persona: agent.config.prompts.expertise + "\n" + agent.config.functions.map(x => x.name).join("\n"),
      // persona: agent.config.prompts.initialMessages({ goal: "" })[0].content ?? "",
      agent,
    };
  });


  const agents = await Rag.standard<{ persona: string, agent: Agent}>(context)
    .items(agentsWithPrompts)
    .limit(1)
    .selector(x => x.persona)
    .query(query);

  const agentsWithPrompt = agents[0];

  return [
    agentsWithPrompt.agent, 
    agentsWithPrompt.agent.config.functions.map((fn: any) => {
      return {
        definition: fn.getDefinition(),
        buildExecutor: (context: AgentContext) => {
          return fn.buildExecutor(agentsWithPrompt.agent);
        }
      }
    }),
    agentsWithPrompt.persona, 
    agentsWithPrompts.map(x => x.agent.config.functions).flat()
  ];
};

export class TextChunker {
  static singleLine(content: string): string[] {
    const lines = cleanWhitespace(content).split("\n");
    return lines;
  }

  static multiLines(content: string, linesPerChunk: number): string[] {
    const lines = cleanWhitespace(content).split("\n");
    const chunks = [];
    for (let i = 0; i < lines.length; i += linesPerChunk) {
      chunks.push(lines.slice(i, i + linesPerChunk).join("\n"));
    }
    return chunks;
  }

  static characters(content: string, characterLimit: number): string[] {
    const trimmedContent = cleanWhitespace(content);
    const chunks = [];
    let currentChunk = "";
    for (const char of trimmedContent) {
      if (currentChunk.length + 1 > characterLimit) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      currentChunk += char;
    }
    return chunks;
  }
}

export class Rag {
  static text(context: AgentContext): TextRagBuilder {
    return new TextRagBuilder(context);
  }

  static standard<TItem = string>(context: AgentContext): StandardRagBuilder<TItem> {
    return new StandardRagBuilder<TItem>(context);
  }
}

export class StandardRagBuilder<TItem> {
  private _limit: number;
  private _items: TItem[];
  private _selector: (item: TItem) => string;
  
  constructor(private readonly context: AgentContext) {
  }

  items(items: TItem[]): StandardRagBuilder<TItem> {
    this._items = items;
    return this;
  }

  limit(limit: number): StandardRagBuilder<TItem> {
    this._limit = limit;
    return this;
  }

  selector(selector: (item: any) => string): StandardRagBuilder<TItem> {
    this._selector = selector;
    return this;
  }

  async query(query: string): Promise<TItem[]> {
    const embeddingApi = new OpenAIEmbeddingAPI(
      this.context.env.OPENAI_API_KEY,
      this.context.logger,
      this.context.chat.tokenizer
    );
  
    const db = new LocalVectorDB(this.context.workspace, "testdb", embeddingApi)
  
    const uuid = Math.floor(Date.now() / 1000).toString(16);
  
    const collection = db.addCollection(uuid);
  
    await collection.add(this._items.map(x => this._selector(x)));
  
    const results = await collection.search(query, this._limit);
  
    const texts = results.map(result => result.text())
  
    return texts.map(text => {
      const item = this._items.find(x => this._selector(x) === text);
      if (!item) {
        throw new Error(`Text ${text} not found in items.`);
      }
      return item;
    });
  }
}

export class TextRagBuilder {
  private _limit: number;
  private _characterLimit: number;
  private _chunks: string[];

  constructor(private readonly context: AgentContext) {
  }

  chunks(chunks: string[]): TextRagBuilder {
    this._chunks = chunks;
    return this;
  }

  limit(limit: number): TextRagBuilder {
    this._limit = limit;
    return this;
  }

  characterLimit(characterLimit: number): TextRagBuilder {
    this._characterLimit = characterLimit;
    return this;
  }

  async query(query: string): Promise<string[]> {
    const relevantLines = await Rag.standard(this.context)
      .items(this._chunks)
      .limit(this._limit)
      .selector(x => x)
      .query(query);

    let totalLength = 0;
    const returnedLines = [];
    for (const line of relevantLines) {
      if (totalLength + line.length > this._characterLimit) {
        break;
      }
      returnedLines.push(line);
      totalLength += line.length;
    }
    return returnedLines;
  }
}

export const cleanWhitespace = (text: string) => text
  .split("\n")
  .map(x => x.replace(/\s+/g, ' ').trim())
  .filter(x => x.length > 0)
  .join("\n");