import {
  AgentFunction,
  ChatLogs,
  ChatMessage,
  FunctionDefinition,
  MessageChunker,
  Timeout,
  Tokenizer,
  Workspace,
  ContextualizedChat,
  Chat,
  agentFunctionBaseToAgentFunction,
  tokensToChars,
  Rag,
  AgentOutput
} from "@evo-ninja/agent-utils";
import { Agent } from "../../Agent";
import { AgentContext } from "@evo-ninja/agent-utils";
import { agentPrompts, prompts } from "./prompts";
import { GoalRunArgs } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { Prompt } from "./Prompt";
import { NewAgent } from "./NewAgent";
import { findBestAgent } from "./findBestAgent";

export class ChameleonAgent extends NewAgent<GoalRunArgs> {
  private _cChat: ContextualizedChat;
  private _chunker: MessageChunker;
  private previousPrediction: string | undefined;
  private previousPredictionVector: number[] | undefined;
  private loopCounter: number = 0;
  private previousAgent: Agent<unknown> | undefined;
  private initializedAgents: Set<string> = new Set();
  private goal: string = "";

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
    this._cChat = new ContextualizedChat(
      this.context,
      this.context.chat,
      this._chunker,
      context.variables
    );
  }

  protected initializeChat(args: GoalRunArgs): void {
    const { chat } = this.context;

    chat.persistent(buildDirectoryPreviewMsg(this.context.workspace));
    chat.persistent("user", prompts.exhaustAllApproaches);
    chat.persistent("user", prompts.variablesExplainer);
    chat.persistent("user", args.goal);
    this.goal = args.goal;
  }

  protected async beforeLlmResponse(): Promise<{ logs: ChatLogs, agentFunctions: FunctionDefinition[], allFunctions: AgentFunction<AgentContext>[], finalOutput?: AgentOutput }> {
    const { chat } = this.context;
    const { messages } = chat.chatLogs;

    if (this.previousPrediction && this.previousPredictionVector) {
      // This will shorten only new messages (since the rest were already shortened)
      await this.shortenLargeMessages(this.previousPrediction, this.previousPredictionVector);
    }

    const prediction = (!this.previousPrediction || this.loopCounter % 2 === 0) ?
      await this.predictBestNextStep(messages, this.previousAgent, this.previousPrediction ? "SUCCESS": undefined) :
      this.previousPrediction;

    this.loopCounter += 1;

    if (prediction === "SUCCESS" || prediction.includes("\"SUCCESS\"")) {
      return {
        logs: chat.chatLogs,
        agentFunctions: [],
        allFunctions: [],
        finalOutput: {
          type: "success",
          title: "SUCCESS"
        }
      };
    }

    const predictionVector = await this.createEmbeddingVector(prediction);

    const [agent, agentFunctions, persona, allFunctions] = await findBestAgent(predictionVector, this.context);

    if (!this.initializedAgents.has(agent.config.prompts.name)) {
      this.initializedAgents.add(agent.config.prompts.name);
      await agent.onFirstRun({ goal: this.goal }, chat);
    }

    this.previousPrediction = prediction;
    this.previousPredictionVector = predictionVector;
    this.previousAgent = agent;
    console.log("Prediction: ", prediction);

    const contextualizedChat = await this.contextualizeChat(predictionVector);

    const logs = insertPersonaAsFirstMsg(persona, contextualizedChat.chatLogs, chat.tokenizer);

    return {
      logs,
      agentFunctions,
      allFunctions: allFunctions.map(agentFunctionBaseToAgentFunction(agent))
    }
  }

  private async contextualizeChat(predictionVector: number[]): Promise<Chat> {
    const maxContextTokens = this.context.llm.getMaxContextTokens();
    const maxResponseTokens = this.context.llm.getMaxResponseTokens();
    // TODO: remove this once we properly track function definition tokens
    const fuzz = 500;
    const maxChatTokens = maxContextTokens - maxResponseTokens - fuzz;

    return await this._cChat.contextualize(
      predictionVector, {
        persistent: maxChatTokens * 0.25,
        temporary: maxChatTokens * 0.75
      }
    );
  }

  private async predictBestNextStep(messages: ChatMessage[], previousAgent: Agent<unknown> | undefined, terminationStr?: string): Promise<string> {
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
          Consider that if information needs to be used, and it is not in the chat, it must be searched or read.
          In your expert opinion, what is the best next step for the assistant?
          ${terminationStr && this.goal.length < 350 ? `If you are 100% sure the user's goal has been achieved, simply respond with "${terminationStr}". The user's goal is: "${this.goal}"` : ""}`
        ),
      {
        model: "gpt-3.5-turbo-16k-0613"
      }
    );
  };

  // TODO: explore removing this
  private async shortenLargeMessages(query: string, queryVector: number[]): Promise<void> {
    for(let i = 0; i < this.context.chat.chatLogs.messages.length ; i++) {
      const message = this.context.chat.chatLogs.messages[i];
      if (i <= 3 || !this.isLargeMsg(message)) {
      } else {
        message.content = await this.advancedFilterText(message.content ?? "", query, queryVector);
      }
    }
  }

  // TODO: try using same ContextualizeChat logic for chunking and summarizing?
  private async advancedFilterText(text: string, query: string, queryVector: number[]): Promise<string> {
    const maxTokensToUse = this.maxContextTokens() * 0.45;
    const tokensForPreview = maxTokensToUse * 0.7;

    const bigPreview = await Rag.filterWithSurroundingText(
      text, 
      queryVector, 
      this.context,
      {
        tokenLimit: tokensForPreview,
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

    const outputTokens = Math.floor(maxTokensToUse * 0.25);
    const filteredText = await this.askLlm(prompt, { maxResponseTokens: outputTokens, model: "gpt-3.5-turbo-16k-0613" });

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
