import {
  AgentFunction,
  Chat,
  ChatLogs,
  ChatMessage,
  FunctionDefinition,
  Timeout,
  Tokenizer,
  Workspace,
} from "@evo-ninja/agent-utils";
import { AgentContext } from "../../AgentContext";
import { agentPrompts, prompts } from "./prompts";
import { GoalRunArgs } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { Rag } from "./Rag";
import { TextChunker } from "./TextChunker";
import { Prompt } from "./Prompt";
import { NewAgent } from "./NewAgent";
import { previewChunks } from "./helpers";
import { findBestAgent } from "./findBestAgent";

export class ChameleonAgent extends NewAgent<GoalRunArgs> {
  private lastQuery: string | undefined;

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

  protected initializeChat(args: GoalRunArgs): void {
    const { chat } = this.context;
    
    chat.persistent(buildDirectoryPreviewMsg(this.context.workspace));
    chat.persistent("user", prompts.exhaustAllApproaches);
    chat.persistent("user", args.goal);
  }

  protected async beforeLlmResponse(): Promise<{ logs: ChatLogs, agentFunctions: FunctionDefinition[], allFunctions: AgentFunction<AgentContext>[]}> {
    const { chat } = this.context;
    const { messages } = chat.chatLogs;

    let query = "";
    if (messages.length <= 2) {
      query = messages.slice(-1)[0].content ?? "";
    } else {
      const lastMessage = messages.slice(-1)[0];

      if (isLargeMsg(lastMessage)) {
        await shortenMessage(lastMessage, this.lastQuery!, this.context);
      }
      
      query = await this.predictBestNextStep(messages);
    }
    this.lastQuery = query;
    console.log("Query: ", query);

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

  async predictBestNextStep(messages: ChatMessage[]): Promise<string> {
    //TODO: Keep persona in chat logs when doing this
    return await this.askLlm(
      new Prompt()
        .json([
          { role: "user", content: prompts.generalAgentPersona }, 
          ...messages
        ])
        .line(`
          Consider the above chat between a user and assistant.
          In your expert opinion, what is the best next step for the assistant?`
        )
    );
  };
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

const isLargeMsg = (message: ChatMessage): boolean => {
  return !!message.content && message.content.length > 2000;
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
  await filterMessageContent(message, query, context);
};

const filterMessageContent = async (message: ChatMessage, query: string, context: AgentContext): Promise<void> => {
  message.content = previewChunks(
    (await Rag.standard(TextChunker.characters(message.content ?? "", 1000), context)
      .limit(2)
      .selector(x => x)
      .query(query))
      .sortByIndex()
      .onlyUnique(),
    2000
  );
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
