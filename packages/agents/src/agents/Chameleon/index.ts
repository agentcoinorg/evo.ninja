import {
  AgentFunction,
  AgentOutput,
  Chat,
  ChatLogs,
  ChatMessage,
  ExecuteAgentFunctionCalled,
  FunctionDefinition,
  RunResult,
  Timeout,
  Tokenizer,
  Workspace,
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

export class ChameleonAgent extends Agent {
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

      // Add functions to chat
      this.config.functions.forEach((fn) => {
        chat.addFunction(fn.getDefinition());
      });

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
        this.beforeLlmResponse.bind(this)
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
  newLogs.insert("persistent", {
    tokens: tokenizer.encode(persona).length,
    msgs: [{
      role: "user",
      content: persona,
    } as ChatMessage],
  }, 0);

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