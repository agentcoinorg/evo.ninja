import {
  AgentFunction,
  AgentOutput,
  Chat,
  ChatLogs,
  ChatMessage,
  ExecuteAgentFunctionCalled,
  FunctionDefinition,
  MessageChunker,
  RunResult,
  Timeout,
  Tokenizer,
  Workspace,
  LocalVectorDB,
  OpenAIEmbeddingAPI,
  LlmApi,
  LlmQueryBuilder
} from "@evo-ninja/agent-utils";
import { AgentContext } from "../../AgentContext";
import { agentPrompts, prompts } from "./prompts";
import { Agent, GoalRunArgs } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { ResultErr } from "@polywrap/result";
import { basicFunctionCallLoop } from "./basicFunctionCallLoop";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { DeveloperAgent, ResearcherAgent, DataAnalystAgent, WebResearcherAgent, ScribeAgent } from "../../scriptedAgents";
import { ScripterAgent } from "../Scripter";
import { Rag } from "./Rag";
import { TextChunker } from "./TextChunker";
import { Prompt } from "./Prompt";
import { ContextualizedChat } from "./ContextualizedChat";

export class ChameleonAgent extends Agent {
  private _cChat: ContextualizedChat;
  private _chunker: MessageChunker;
  private _prevChatLogs: ChatLogs | undefined;

  constructor(
    context: AgentContext,
    timeout?: Timeout,
  ) {
    super(
      new AgentConfig(
        agentPrompts,
        [],
        context.scripts,
        timeout
      ),
      context,
    );
    this._chunker = new MessageChunker({ maxChunkSize: 500 });
    // Gross, I know... will cleanup later
    this._cChat = new ContextualizedChat(
      context.chat,
      this._chunker,
      new LocalVectorDB(this.context.internals, "cchat", new OpenAIEmbeddingAPI(
        this.context.env.OPENAI_API_KEY,
        this.context.logger,
        this.context.chat.tokenizer
      ))
    );
  }

  public async* run(
    args: GoalRunArgs,
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    this.initializeChat(args);
    return yield* this.runWithChat(this.config.prompts.initialMessages(args));
  }

  public override async* runWithChat(
    messages: ChatMessage[],
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    if (this.config.timeout) {
      setTimeout(
        this.config.timeout.callback,
        this.config.timeout.milliseconds
      );
    }
    try {
      for (const message of messages) {
        chat.persistent(message);
      }

      if (this.config.timeout) {
        setTimeout(this.config.timeout.callback, this.config.timeout.milliseconds);
      }

      return yield* basicFunctionCallLoop(
        this.context,
        this.config.functions.map((fn) => {
          return {
            definition: fn.getDefinition(),
            buildExecutor: (context: AgentContext) => {
              return fn.buildExecutor(this);
            }
          }
        }),
        (functionCalled: ExecuteAgentFunctionCalled) => {
          return this.config.shouldTerminate(functionCalled);
        },
        this.config.prompts.loopPreventionPrompt,
        this.config.prompts.agentSpeakPrompt,
        this.beforeLlmResponse2.bind(this)
      );
    } catch (err) {
      this.context.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }

  protected initializeChat(args: GoalRunArgs): void {
    const { chat } = this.context;

    chat.persistent(buildDirectoryPreviewMsg(this.context.workspace));
    chat.persistent("user", prompts.exhaustAllApproaches);
    chat.persistent("user", args.goal);
  }

  protected async beforeLlmResponse2(): Promise<{ logs: ChatLogs, agentFunctions: FunctionDefinition[], allFunctions: AgentFunction<AgentContext>[]}> {

    const emptyMessage: ChatMessage = {
      role: "system",
      content: ""
    };

    // Retrieve the last message (or a summary of it)
    let lastMessage = this.context.chat.getLastMessage("temporary") || emptyMessage;
    if (this._chunker.shouldChunk(lastMessage)) {
      lastMessage.content = await summarizeMessage(
        lastMessage,
        this.context.llm,
        this.context.chat.tokenizer
      );
    }

    // Predict the next step
    const prediction = await this.askLlm(
      new Prompt()
        .json([
          ...(this._prevChatLogs?.messages || []),
          lastMessage
        ])
        .line(`
          Consider the above chat between a user and assistant.
          In your expert opinion, what is the best next step for the assistant?`
        )
    );

    const [agent, agentFunctions, persona, allFunctions] = await findBestAgent(prediction, this.context);

    const context = `${persona}\n${prediction}`;
    const maxContextTokens = this.context.llm.getMaxContextTokens();
    const maxResponseTokens = this.context.llm.getMaxResponseTokens();
    // TODO: remove this once we properly track function definition tokens
    const fuzz = 500;
    const maxChatTokens = maxContextTokens - maxResponseTokens - fuzz;

    const contextualizedChat = await this._cChat.contextualize(
      context, {
        persistent: maxChatTokens * 0.25,
        temporary: maxChatTokens * 0.75
      }
    );

    const logs = insertPersonaAsFirstMsg(
      persona,
      contextualizedChat.chatLogs,
      contextualizedChat.tokenizer
    );

    return {
      logs,
      agentFunctions,
      allFunctions: allFunctions.map((fn: any) => {
        return {
          definition: fn.getDefinition(),
          buildExecutor: (context: AgentContext) => {
            return fn.buildExecutor(agent);
          }
        }
      })
    }
  }

  protected async beforeLlmResponse(): Promise<{ logs: ChatLogs, agentFunctions: FunctionDefinition[], allFunctions: AgentFunction<AgentContext>[]}> {
    const { chat } = this.context;
    const { messages } = chat.chatLogs;
    const getQuery = (msg: ChatMessage) => this.askLlm(
      new Prompt()
        .json(msg)
        .line("What is the above message trying to achieve?")
    );

    let query = "";
    if (messages.length <= 2) {
      query = messages.slice(-1)[0].content ?? "";
    } else {
      const lastMessage = messages.slice(-1)[0];

      if (isLargeMsg(lastMessage)) {
        const q = await getQuery(messages.slice(-2)[0]);

        await shortenMessage(lastMessage, q, this.context);
      }
      query = await getQuery(lastMessage);
    }

    await shortenLargeMessages(query, chat, this.context);

    const [agent, agentFunctions, persona, allFunctions] = await findBestAgent(query, this.context);

    const logs = insertPersonaAsFirstMsg(persona, chat.chatLogs, chat.tokenizer);

    return {
      logs,
      agentFunctions,
      allFunctions: allFunctions.map((fn: any) => {
        return {
          definition: fn.getDefinition(),
          buildExecutor: (context: AgentContext) => {
            return fn.buildExecutor(agent);
          }
        }
      })
    }
  }
}

const insertPersonaAsFirstMsg = (persona: string, logs: ChatLogs, tokenizer: Tokenizer): ChatLogs => {
  const newLogs = logs.clone();
  newLogs.insert("persistent",
    [{
      role: "user",
      content: persona,
    } as ChatMessage],
    [tokenizer.encode(persona).length],
    0
  );

  return newLogs;
};

const findBestAgent = async (query: string, context: AgentContext): Promise<[Agent<unknown>, FunctionDefinition[], string, AgentFunctionBase<unknown>[]]> => {
  const allAgents: Agent[] = [
    DeveloperAgent,
    ResearcherAgent,
    DataAnalystAgent,
    ScripterAgent,
    ScribeAgent,
    WebResearcherAgent
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
    agentsWithPrompt.agent.config.functions.map(f => f.getDefinition()),
    agentsWithPrompt.persona,
    agentsWithPrompts.map(x => x.agent.config.functions).flat()
  ];
};

const isLargeMsg = (message: ChatMessage): boolean => {
  return !!message.content && message.content.length > 2000;
}

const joinUnderCharsLimit = (chunks: string[], characterLimit: number, separator: string): string => {
  let result = "";

  for (const chunk of chunks) {
    if (result.length + chunk.length + separator.length > characterLimit) {
      break;
    }

    if (result === "") {
      result += chunk;
    } else {
      result += separator + chunk;
    }
  }

  return result;
}

const shortenLargeMessages = async (query: string, chat: Chat, context: AgentContext): Promise<void> => {
  for(let i = 2; i < chat.chatLogs.messages.length ; i++) {
    const message = chat.chatLogs.messages[i];
    if (isLargeMsg(message)) {
      await shortenMessage(message, query, context);
    }
  }
};

const shortenMessage = async (message: ChatMessage, query: string, context: AgentContext): Promise<void> => {
    const result = await Rag.text(context)
      .chunks(TextChunker.words(message.content ?? "", 100))
      .limit(50)
      .characterLimit(2000)
      .query(query);

    message.content = "...\n" + joinUnderCharsLimit(result, 1995, "\n...\n");
};

const buildDirectoryPreviewMsg = (workspace: Workspace): ChatMessage => {
  const files = workspace.readdirSync("./");
  return {
    role: "system",
    content: `Current directory: './'
Files: ${
files.filter((x) => x.type === "file").map((x) => x.name).join(", ")
}\nDirectories: ${
files.filter((x) => x.type === "directory").map((x) => x.name).join(", ")
}` 
  }
};

async function summarizeMessage(message: ChatMessage, llm: LlmApi, tokenizer: Tokenizer): Promise<string> {
  const fuzTokens = 200;
  const maxTokens = llm.getMaxContextTokens() - fuzTokens;

  const prompt = (summary: string | undefined) => {
    return `Summarize the following data. Includes all unique details.\n
            ${summary ? `An existing summary exists, please add all new details found to it.\n\`\`\`\n${summary}\n\`\`\`\n` : ``}`;
  }
  const appendData = (prompt: string, chunk: string) => {
    return `${prompt}\nData:\n\`\`\`\n${chunk}\n\`\`\``;
  }

  let summary: string | undefined = undefined;
  const data = message.content || "";
  const len = data.length;
  let idx = 0;

  while (idx < len) {
    const promptStr = prompt(summary);
    const propmtTokens = this.tokenizer.encode(promptStr).length;
    const chunkTokens = (maxTokens - propmtTokens);
    const chunk = data.substring(idx, Math.min(idx + chunkTokens, len));
    idx += chunkTokens;

    const promptFinal = appendData(promptStr, chunk);

    summary = await new LlmQueryBuilder(llm, tokenizer)
      .persistent(message.role, promptFinal)
      .build()
      .content();
  }

  return summary || "";
}
