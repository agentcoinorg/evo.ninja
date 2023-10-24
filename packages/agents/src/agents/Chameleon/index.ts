import {
  AgentFunction,
  ChatLogs,
  ChatMessage,
  FunctionDefinition,
  MessageChunker,
  TextChunker,
  Timeout,
  Tokenizer,
  Workspace,
  LocalVectorDB,
  OpenAIEmbeddingAPI,
  ContextualizedChat,
  Chat
} from "@evo-ninja/agent-utils";
import { Agent } from "../../Agent";
import { AgentContext } from "../../AgentContext";
import { agentPrompts, prompts } from "./prompts";
import { GoalRunArgs } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { Rag } from "./Rag";
import { Prompt } from "./Prompt";
import { NewAgent } from "./NewAgent";
import { agentFunctionBaseToAgentFunction, previewChunks, tokensToChars } from "./helpers";
import { findBestAgent } from "./findBestAgent";

export class ChameleonAgent extends NewAgent<GoalRunArgs> {
  private _cChat: ContextualizedChat;
  private _chunker: MessageChunker;
  private previousPrediction: string | undefined;
  private previousAgent: Agent<unknown> | undefined;

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
    this._chunker = new MessageChunker({ maxChunkSize: context.variables.saveThreshold });
    const embeddingApi = new OpenAIEmbeddingAPI(
      this.context.env.OPENAI_API_KEY,
      this.context.logger,
      this.context.chat.tokenizer
    );
    this._cChat = new ContextualizedChat(
      this.context.chat,
      this._chunker,
      new LocalVectorDB(this.context.internals, "cchat", embeddingApi),
      context.variables
    );
  }

  protected initializeChat(args: GoalRunArgs): void {
    const { chat } = this.context;

    chat.persistent(buildDirectoryPreviewMsg(this.context.workspace));
    chat.persistent("user", prompts.exhaustAllApproaches);
    chat.persistent("user", prompts.variablesExplainer);
    chat.persistent("user", args.goal);
  }

  protected async beforeLlmResponse(): Promise<{ logs: ChatLogs, agentFunctions: FunctionDefinition[], allFunctions: AgentFunction<AgentContext>[]}> {
    const { chat } = this.context;
    const { messages } = chat.chatLogs;

    if (this.previousPrediction) {
      // This will shorten only new messages (since the rest were already shortened)
      await this.shortenLargeMessages(this.previousPrediction);
    }

    const prediction = await this.predictBestNextStep(messages, this.previousAgent);

    const [agent, agentFunctions, persona, allFunctions] = await findBestAgent(prediction, this.context);

    this.previousPrediction = prediction;
    this.previousAgent = agent;
    console.log("Prediction: ", prediction);

    const contextualizedChat = await this.contextualizeChat(persona, prediction);

    const logs = insertPersonaAsFirstMsg(persona, contextualizedChat.chatLogs, chat.tokenizer);

    return {
      logs,
      agentFunctions,
      allFunctions: allFunctions.map(agentFunctionBaseToAgentFunction(agent))
    }
  }

  private async contextualizeChat(persona: string, prediction: string): Promise<Chat> {
    const context = `${persona}\n${prediction}`;
    const maxContextTokens = this.context.llm.getMaxContextTokens();
    const maxResponseTokens = this.context.llm.getMaxResponseTokens();
    // TODO: remove this once we properly track function definition tokens
    const fuzz = 500;
    const maxChatTokens = maxContextTokens - maxResponseTokens - fuzz;

    return await this._cChat.contextualize(
      context, {
        persistent: maxChatTokens * 0.25,
        temporary: maxChatTokens * 0.75
      }
    );
  }

  private async predictBestNextStep(messages: ChatMessage[], previousAgent: Agent<unknown> | undefined): Promise<string> {
    const agentPersona = previousAgent ?
      // TODO: fix this when we refactor agent prompts
      previousAgent.config.prompts.initialMessages({ goal: "" }).slice(0, -1) :
      [{ role: "user", content: prompts.generalAgentPersona }];

    return await this.askLlm(
      new Prompt()
        .json([
          ...agentPersona,
          ...messages
        ])
        .line(`
          Consider the above chat between a user and assistant.
          In your expert opinion, what is the best next step for the assistant?`
        )
    );
  };

  private async shortenLargeMessages(query: string): Promise<void> {
    for(let i = 0; i < this.context.chat.chatLogs.messages.length ; i++) {
      const message = this.context.chat.chatLogs.messages[i];
      if (i <= 3 || !this.isLargeMsg(message)) {
      } else {
        message.content = await this.advancedFilterText(message.content ?? "", query);
      }
    }
  }

  private async advancedFilterText(text: string, query: string): Promise<string> {
    const chunks = TextChunker.parentDocRetrieval(text, {
      parentChunker: (text: string) => TextChunker.sentences(text),
      childChunker: (parentText: string) =>
        TextChunker.fixedCharacterLength(parentText, { chunkLength: 100, overlap: 15 })
    });

    const maxCharsToUse = this.maxContextChars() * 0.75;
    const charsForPreview = maxCharsToUse * 0.7;

    const bigPreview = await Rag.standard(chunks, this.context)
      .selector(x => x.doc)
      .limit(48)
      .sortByIndex()
      .onlyUnique()
      .query(query)
      .map(x => x.metadata.parent)
      .unique()
      .then(x => previewChunks(x, charsForPreview));

    const prompt = new Prompt()
      .block(bigPreview)
      .line(`Goal:`)
      .line(x => x.block(query))
      .line(`
        Consider the above text in respect to achieving the desired goal.
        Summarize the text, including all unique details.
        Filter out unecessary information. Do not add new information.
        IMPORTANT: Respond only with the new text!`
      ).toString();

    const filteredText = await this.askLlm(prompt, Math.floor(this.maxContextTokens() * 0.06));

    console.log("filteredText", filteredText);
    console.log("maxCharsToUse", maxCharsToUse);
    console.log("charsForPreview", charsForPreview);
    console.log("response chars", this.maxContextChars() * 0.06);
    console.log("filteredText.length", filteredText.length);

    return filteredText;
  }

  private maxContextChars(): number {
    return tokensToChars(this.maxContextTokens());
  }

  private maxContextTokens(): number {
    return this.context.llm.getMaxContextTokens() ?? 8000;
  }


  isLargeMsg = (message: ChatMessage): boolean => {
    return !!message.content && message.content.length > this.maxContextChars() * 0.0625;
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

const buildDirectoryPreviewMsg = (workspace: Workspace): ChatMessage => {
  const files = workspace.readdirSync("./");
  return {
    role: "user",
    content: `Current directory: './'
Files: ${
files.filter((x) => x.type === "file").map((x) => x.name).join(", ")
}\nDirectories: ${
files.filter((x) => x.type === "directory").map((x) => x.name).join(", ")
}` 
  }
};
