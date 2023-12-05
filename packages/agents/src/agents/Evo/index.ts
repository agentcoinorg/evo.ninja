import {
  AgentFunction,
  ChatLogs,
  ChatMessage,
  FunctionDefinition,
  MessageChunker,
  Tokenizer,
  ContextualizedChat,
  Chat,
  agentFunctionBaseToAgentFunction,
  tokensToChars,
  AgentOutput,
  AgentContext,
  Prompt
} from "@/agent-core";
import { agentPrompts, prompts } from "./prompts";
import { Agent, AgentConfig, GoalRunArgs } from "../../agents/utils";
import { findBestAgent } from "./findBestAgent";
import { Timeout, Workspace } from "@evo-ninja/agent-utils";

export class Evo extends Agent<GoalRunArgs> {
  private _cChat: ContextualizedChat;
  private _chunker: MessageChunker;
  private previousPrediction: string | undefined;
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

  public reset() {
    this.previousPrediction = undefined;
    this.loopCounter = 0;
    this.previousAgent = undefined;
    this.initializedAgents = new Set();
    this.goal = "";
    this.context.chat = this.context.chat.cloneEmpty();
    this._cChat = new ContextualizedChat(
      this.context,
      this.context.chat,
      this._chunker,
      this.context.variables
    );
  }

  protected async initializeChat(args: GoalRunArgs): Promise<void> {
    const { chat } = this.context;

    const initialMessages: ChatMessage[] = [
      buildDirectoryPreviewMsg(this.context.workspace),
      { role: "user", content: prompts.exhaustAllApproaches },
      { role: "user", content: prompts.variablesExplainer },
      { role: "user", content: args.goal },
    ]

    await chat.persistent(initialMessages);
    this.goal = args.goal;
  }

  protected async beforeLlmResponse(): Promise<{ logs: ChatLogs, agentFunctions: FunctionDefinition[], allFunctions: AgentFunction<AgentContext>[], finalOutput?: AgentOutput }> {
    const { chat } = this.context;
    const { messages } = chat.chatLogs;

    const prediction = (!this.previousPrediction || this.loopCounter % 2 === 0) ?
      await this.predictBestNextStep(messages, this.previousAgent, this.previousPrediction ? "SUCCESS": undefined) :
      this.previousPrediction;

    this.loopCounter += 1;

    if (
      prediction === "SUCCESS" ||
      prediction.includes("\"SUCCESS\"") ||
      prediction.includes("goal has been achieved")
    ) {
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

    this.context.logger.info("### Prediction:\n-> " + prediction);

    const [agent, agentFunctions, persona, allFunctions] = await findBestAgent(predictionVector, this.context);

    if (!this.initializedAgents.has(agent.config.prompts.name)) {
      this.initializedAgents.add(agent.config.prompts.name);
      await agent.onFirstRun({ goal: this.goal }, chat);
    }

    this.previousPrediction = prediction;
    this.previousAgent = agent;

    const contextualizedChat = await this.contextualizeChat(
      await this.createEmbeddingVector(`${persona}\n${prediction}`)
    );

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
          ${terminationStr && this.goal.length < 350 ? `If you are 100% sure the user's goal has been achieved, simply respond with "${terminationStr}". The user's goal is: "${this.goal}". If the user asks for an output file, has it been written?` : ""}`
        ),
      {
        model: "gpt-3.5-turbo-16k"
      }
    );
  };

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
