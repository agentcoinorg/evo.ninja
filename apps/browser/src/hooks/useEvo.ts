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
import { useDojo } from "./useDojo";
import { ProxyEmbeddingApi, ProxyLlmApi } from "../api";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";
import { atom, useAtom } from "jotai";
import { ChatMessage } from "../components/Chat";
import { capReachedAtom } from "../store";

// interface State {
//     evo: Evo
//     iterator: ReturnType<Evo["run"]>
//     running: boolean
// }

export const userWorkspaceAtom = atom<InMemoryWorkspace | undefined>(undefined);

export function useEvo(onMessage: (message: ChatMessage) => void) {
  const { dojo, setDojoError } = useDojo();
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
        OPENAI_API_KEY: dojo.config.openAiApiKey || " ",
        GPT_MODEL: dojo.config.model,
        CONTEXT_WINDOW_TOKENS: "8000",
        MAX_RESPONSE_TOKENS: "2000",
      });

      let llm: LlmApi;
      let embedding: EmbeddingApi;

      if (dojo.config.openAiApiKey) {
        llm = new OpenAILlmApi(
          env.OPENAI_API_KEY,
          env.GPT_MODEL as LlmModel,
          env.CONTEXT_WINDOW_TOKENS,
          env.MAX_RESPONSE_TOKENS,
          logger
        );
        embedding = new OpenAIEmbeddingAPI(
          env.OPENAI_API_KEY,
          logger,
          cl100k_base
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
      setDojoError(e.message);
    }
  }, [dojo.config]);

  return { evo, proxyEmbeddingApi, proxyLlmApi };
}
