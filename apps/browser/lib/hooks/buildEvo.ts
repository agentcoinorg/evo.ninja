import { BrowserLogger } from "../sys/logger";
import { createInBrowserScripts } from "../scripts";
import { ProxyEmbeddingApi, ProxyLlmApi } from "../api";

import {
  AgentContext,
  ConsoleLogger,
  EmbeddingApi,
  Env,
  Evo,
  InMemoryWorkspace,
  LlmApi,
  LlmModel,
  Logger,
  OpenAIEmbeddingAPI,
  OpenAILlmApi,
  Scripts,
  Chat as EvoChat,
  SubWorkspace,
  ChatMessage,
  AgentVariables,
  ChatLogType,
  Workspace,
} from "@evo-ninja/agents";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";

import { ChatLog } from "@/components/Chat";

export const buildEvo = async (
  onChatLog: (message: ChatLog) => Promise<void>,
  onMessagesAdded: (
    type: ChatLogType,
    messages: ChatMessage[]
  ) => Promise<void>,
  onVariableSet: (key: string, value: string) => Promise<void>,
  setCapReached: (capReached: boolean) => void,
  setLlmProxyApi: (llm: ProxyLlmApi) => void,
  setEmbeddingProxyApi: (embedding: ProxyEmbeddingApi) => void,
  localOpenAiApiKey: string | null,
  userWorkspace: Workspace
): Promise<Evo> => {
  const browserLogger = new BrowserLogger({
    onLog: async (message: string) => {
      await onChatLog({
        user: "evo",
        title: message,
      });
    },
  });
  const logger = new Logger([browserLogger, new ConsoleLogger()], {
    promptUser: () => Promise.resolve("N/A"),
  });

  const scriptsWorkspace = await createInBrowserScripts();
  const scripts = new Scripts(scriptsWorkspace);

  const env = new Env({
    OPENAI_API_KEY: localOpenAiApiKey || " ",
    GPT_MODEL: "gpt-4-1106-preview",
    CONTEXT_WINDOW_TOKENS: "128000",
    MAX_RESPONSE_TOKENS: "4096",
  });

  let llm: LlmApi;
  let embedding: EmbeddingApi;

  if (localOpenAiApiKey) {
    llm = new OpenAILlmApi(
      env.OPENAI_API_KEY,
      env.GPT_MODEL as LlmModel,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger,
      env.OPENAI_API_BASE_URL
    );
    embedding = new OpenAIEmbeddingAPI(
      env.OPENAI_API_KEY,
      logger,
      cl100k_base,
      env.OPENAI_API_BASE_URL
    );
  } else {
    llm = new ProxyLlmApi(
      env.GPT_MODEL as LlmModel,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      () => setCapReached(true)
    );
    setLlmProxyApi(llm as ProxyLlmApi);
    embedding = new ProxyEmbeddingApi(cl100k_base, () => setCapReached(true));
    setEmbeddingProxyApi(embedding as ProxyEmbeddingApi);
  }

  const internals = new SubWorkspace(".evo", new InMemoryWorkspace());

  const chat = new EvoChat(cl100k_base, {
    onMessagesAdded,
  });
  const agentVariables = new AgentVariables({
    onVariableSet,
  });
  return new Evo(
    new AgentContext(
      llm,
      embedding,
      chat,
      logger,
      userWorkspace,
      internals,
      env,
      scripts,
      undefined,
      agentVariables
    )
  );
};
