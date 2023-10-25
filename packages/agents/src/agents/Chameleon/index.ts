import {
  AgentFunction,
  ChatLogs,
  ChatMessage,
  FunctionDefinition,
  MessageChunker,
  Timeout,
  Tokenizer,
  Workspace,
  LocalVectorDB,
  OpenAIEmbeddingAPI,
  ContextualizedChat,
  Chat,
} from "@evo-ninja/agent-utils";
import { Agent } from "../../Agent";
import { AgentContext } from "../../AgentContext";
import { agentPrompts, prompts } from "./prompts";
import { GoalRunArgs } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { Rag } from "./Rag";
import { Prompt } from "./Prompt";
import { NewAgent } from "./NewAgent";
import { agentFunctionBaseToAgentFunction, charsToTokens, tokensToChars } from "./helpers";
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

  protected async initializeChat(args: GoalRunArgs): Promise<void> {
    const { chat } = this.context;

    chat.persistent(buildDirectoryPreviewMsg(this.context.workspace));
    chat.persistent("user", prompts.exhaustAllApproaches);
    chat.persistent("user", prompts.variablesExplainer);


    if (args.goal.length > 1300) {
      const summarizedGoal = await this.askLlm(
        "Summarize this to a max of 1300 characters: \n" + args.goal,
        { model: "gpt-3.5-turbo-0613" }
      );
      chat.persistent("user", summarizedGoal);
    } else {
      chat.persistent("user", args.goal);
    }
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
        ),
      {
        model: "gpt-3.5-turbo-16k-0613"
      }
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
    const maxCharsToUse = this.maxContextChars() * 0.45;
    const charsForPreview = maxCharsToUse * 0.7;

    const bigPreview = await Rag.filterWithSurroundingText(
      text, 
      query, 
      this.context,
      {
        charLimit: charsForPreview,
        surroundingCharacters: 750,
        chunkLength: 100,
        overlap: 15
      });

      const prompt = new Prompt()
        .text("Assistant's next step:")
        .line(x => x.block(query))
        .line("Result:")
        .line(x => x.block(bigPreview))
        .line(`
          Imagine you are an expert content reducer. 
          Above are the snippets of the content result from the assistant's next step.
          Rewrite the content to convey the relevant information that the assistant wanted.
          Merge the snippets into a coherent content result.
          Filter out unecessary information.
          Do not summarize or add new information.
          Make sure you keep all the information and all the data that the assistant wanted.
          IMPORTANT: Respond only with the new content!"`
        ).toString();

    const outputTokens = charsToTokens(maxCharsToUse * 0.25);
    const filteredText = await this.askLlm(prompt, { maxResponseTokens: outputTokens });

    console.log("filteredText", filteredText);
    console.log("maxCharsToUse", maxCharsToUse);
    console.log("charsForPreview", charsForPreview);
    console.log("output tokens", outputTokens);
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
