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
} from "@evo-ninja/agents";
import { useEffect, useState } from "react";
import { BrowserLogger } from "../sys/logger";
import { createInBrowserScripts } from "../scripts";
import { ProxyEmbeddingApi, ProxyLlmApi } from "../api";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";
import { atom, useAtom } from "jotai";
import { ChatMessage } from "@/components/Chat";
import { capReachedAtom, localOpenAiApiKeyAtom } from "@/lib/store";

export const userWorkspaceAtom = atom<InMemoryWorkspace | undefined>(undefined);

export function useEvo(onMessage: (message: ChatMessage) => void, setError: (msg: string) => void) {
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom)
  const [evo, setEvo] = useState<Evo | undefined>();
  const [proxyEmbeddingApi, setProxyEmbeddingApi] = useState<
    ProxyEmbeddingApi | undefined
  >(undefined);
  const [proxyLlmApi, setProxyLlmApi] = useState<ProxyLlmApi | undefined>(
    undefined
  );
  const [, setCapReached] = useAtom(capReachedAtom);
  const [userWorkspace, setUserWorkspace] = useAtom(userWorkspaceAtom);
  useEffect(() => {
    try {
      const browserLogger = new BrowserLogger({
        onLog: (message: string) => {
          onMessage({
            user: "evo",
            title: message,
          });
        },
      });
      const logger = new Logger([browserLogger, new ConsoleLogger()], {
        promptUser: () => Promise.resolve("N/A"),
      });

      const scriptsWorkspace = createInBrowserScripts();
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
          env.OPENAI_API_BASE_URL,
        );
      } else {
        llm = new ProxyLlmApi(
          env.GPT_MODEL as LlmModel,
          env.CONTEXT_WINDOW_TOKENS,
          env.MAX_RESPONSE_TOKENS,
          () => setCapReached(true)
        );
        setProxyLlmApi(llm as ProxyLlmApi);
        embedding = new ProxyEmbeddingApi(cl100k_base, () =>
          setCapReached(true)
        );
        setProxyEmbeddingApi(embedding as ProxyEmbeddingApi);
      }

      let workspace = userWorkspace;

      if (!workspace) {
        workspace = new InMemoryWorkspace();
        setUserWorkspace(workspace);
      }

      const internals = new SubWorkspace(".evo", workspace);

      const chat = new EvoChat(cl100k_base);
      setEvo(
        new Evo(
          new AgentContext(
            llm,
            embedding,
            chat,
            logger,
            workspace,
            internals,
            env,
            scripts
          )
        )
      );
    } catch (e: any) {
      setError(e.message);
    }
  }, [localOpenAiApiKey]);

  return { evo, proxyEmbeddingApi, proxyLlmApi };
}
