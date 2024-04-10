import { ProxyLlmApi, ProxyEmbeddingApi } from "@/lib/api";
import { createInBrowserScripts } from "@/lib/scripts";
import { BrowserLogger } from "@/lib/sys/logger";
import { ChatLog } from "@/components/Chat";
import {
  AgentContext,
  ConsoleLogger,
  EmbeddingApi,
  Env,
  Evo,
  LlmApi,
  LlmModel,
  Logger,
  OpenAIEmbeddingAPI,
  OpenAILlmApi,
  Scripts,
  Chat as EvoChat,
  SubWorkspace,
  AgentVariables,
  Workspace,
  ChatLogType,
  ChatMessage,
} from "@evo-ninja/agents";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";

export function createEvoInstance(
  workspace: Workspace,
  openAiApiKey: string | undefined,
  onMessagesAdded: (type: ChatLogType, messages: ChatMessage[]) => Promise<void>,
  onVariableSet: (key: string, value: string) => Promise<void>,
  onChatLog: (chatLog: ChatLog) => Promise<void>,
  onStatusUpdate: (status: string) => void,
  onGoalCapReached: () => void,
  onError: (error: string) => void
): Evo | undefined {
  let llm: LlmApi;
  let embedding: EmbeddingApi;

  try {
    const browserLogger = new BrowserLogger({
      onLog: async (message: string) => {
        await onChatLog({
          user: "evo",
          title: message,
        });
      },
      onNotice: (msg: string) => {
        onStatusUpdate(msg);
        return Promise.resolve();
      },
      onSuccess: (msg: string) =>
        onChatLog({
          user: "evo",
          title: msg,
        })
    });
    const logger = new Logger([browserLogger, new ConsoleLogger()], {
      promptUser: () => Promise.resolve("N/A"),
    });

    const scriptsWorkspace = createInBrowserScripts();
    const scripts = new Scripts(scriptsWorkspace);

    const env = new Env({
      OPENAI_API_KEY: openAiApiKey || " ",
      GPT_MODEL: "gpt-4-turbo",
      CONTEXT_WINDOW_TOKENS: "128000",
      MAX_RESPONSE_TOKENS: "4096",
    });

    if (openAiApiKey) {
      llm = new OpenAILlmApi(
        env.OPENAI_API_KEY,
        env.GPT_MODEL as LlmModel,
        env.CONTEXT_WINDOW_TOKENS,
        env.MAX_RESPONSE_TOKENS,
        logger,
        env.OPENAI_API_BASE_URL,
      );
      embedding = new OpenAIEmbeddingAPI(
        env.OPENAI_API_KEY,
        logger,
        cl100k_base,
        env.OPENAI_API_BASE_URL,
      );
    } else {
      const llmProxy = new ProxyLlmApi(
        env.GPT_MODEL as LlmModel,
        env.CONTEXT_WINDOW_TOKENS,
        env.MAX_RESPONSE_TOKENS,
        onGoalCapReached,
      );
      llm = llmProxy;
      const embeddingProxy = new ProxyEmbeddingApi(
        cl100k_base,
        onGoalCapReached
      );
      embedding = embeddingProxy;
    }

    const internals = new SubWorkspace(".evo", workspace);

    const chat = new EvoChat(cl100k_base, {
      onMessagesAdded,
    });
    const agentVariables = new AgentVariables({
      onVariableSet
    });

    const evo = new Evo(
      new AgentContext(
        llm,
        embedding,
        chat,
        logger,
        workspace,
        internals,
        env,
        scripts,
        undefined,
        agentVariables
      )
    );
    return evo;
  } catch (e: any) {
    onError(e.message);
    return undefined;
  }
}
