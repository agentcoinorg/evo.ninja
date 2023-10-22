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
import { Agent, GoalRunArgs } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { DeveloperAgent, ResearcherAgent, DataAnalystAgent, WebResearcherAgent, ScribeAgent } from "../../scriptedAgents";
import { ScripterAgent } from "../Scripter";
import { Rag } from "./Rag";
import { TextChunker } from "./TextChunker";
import { Prompt } from "./Prompt";
import { NewAgent } from "./NewAgent";

export class ChameleonAgent extends NewAgent<GoalRunArgs> {
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
      expertise: agent.config.prompts.expertise + "\n" + agent.config.functions.map(x => x.name).join("\n"),
      persona: agent.config.prompts.initialMessages({ goal: "" })[0].content ?? "",
      agent,
    };
  });

  const agents = await Rag.standard<{ persona: string, expertise: string, agent: Agent}>(context)
    .items(agentsWithPrompts)
    .limit(1)
    .selector(x => x.expertise)
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

const joinUnderCharLimit = (chunks: string[], characterLimit: number, separator: string): string => {
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

// const getUnderCharLimit = (chunks: string[], characterLimit: number): string[] => {
//   let totalLength = 0;
//   const newChunks = [];
//   for (const chunk of chunks) {
//     if (totalLength + chunk.length > characterLimit) {
//       const remainingCharacters = characterLimit - totalLength;
//       if (remainingCharacters > 0) {
//         newChunks.push(chunk.substring(0, remainingCharacters));
//       }
//       break;
//     }
//     newChunks.push(chunk);
//     totalLength += chunk.length;
//   }
//   return newChunks;
// }

const shortenLargeMessages = async (query: string, chat: Chat, context: AgentContext): Promise<void> => {
  for(let i = 2; i < chat.chatLogs.messages.length ; i++) {
    const message = chat.chatLogs.messages[i];
    if (isLargeMsg(message)) {
      await shortenMessage(message, query, context);
    }
  }
};

const shortenMessage = async (message: ChatMessage, query: string, context: AgentContext): Promise<void> => {
  message.content = previewChunks(
    await Rag.standard(context)
    .items(TextChunker.words(message.content ?? "", 100))
    .limit(50)
    .selector(x => x)
    .query(query),
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

const previewChunks = (chunks: string[], charLimit: 2000): string => joinUnderCharLimit(chunks, charLimit - "...\n".length, "\n...\n")
// const limitChunks = (chunks: string[], charLimit: 2000): string[] => getUnderCharLimit(chunks, charLimit)
