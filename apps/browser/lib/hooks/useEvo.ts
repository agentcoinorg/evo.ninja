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
  AgentVariables,
} from "@evo-ninja/agents";
import { useEffect, useState } from "react";
import { BrowserLogger } from "../sys/logger";
import { createInBrowserScripts } from "../scripts";
import { ProxyEmbeddingApi, ProxyLlmApi } from "../api";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";
import { useAtom } from "jotai";
import { ChatMessage } from "@/components/Chat";
import { capReachedAtom, errorAtom, localOpenAiApiKeyAtom, userWorkspaceAtom } from "@/lib/store";
import { useSupabase } from "../supabase/useSupabase";
import { mapChatMessageToMessageDTO } from "../supabase/evo";

interface UseEvoArgs {
  chatId: string;
  onMessage: (message: ChatMessage) => void
}

export function useEvo({ chatId, onMessage }: UseEvoArgs) {
  const supabase = useSupabase()
  const [, setError] = useAtom(errorAtom)
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

      const chat = new EvoChat(cl100k_base, {
        async onMessagesAdded(type, msgs) {
          const temporary = type === "temporary"
          const mappedMessages = msgs.map(
            (msg) => mapChatMessageToMessageDTO(chatId, temporary, msg)
          )

          const response = await supabase
            .from('messages')
            .insert(mappedMessages)

          if (response.error) {
            throw response.error
          }
        },
      });
      const agentVariables = new AgentVariables({
        async onVariableSet(key, value) {
          const response = await supabase
          .from('variables')
          .upsert({
            key,
            value,
          })
          .match({ key })

          if (response.error) {
            throw response.error
          }
        },
      })

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
            scripts,
            undefined,
            agentVariables
          )
        )
      );
    } catch (e: any) {
      setError(e.message);
    }
  }, [localOpenAiApiKey]);

  return { evo, proxyEmbeddingApi, proxyLlmApi };
}
