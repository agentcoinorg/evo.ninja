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
  ChatMessage as AgentMessage,
  AgentVariables,
  ChatLogType,
} from "@evo-ninja/agents";
import { useEffect, useState } from "react";
import { BrowserLogger } from "../sys/logger";
import { createInBrowserScripts } from "../scripts";
import { ProxyEmbeddingApi, ProxyLlmApi } from "../api";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";
import { useAtom } from "jotai";
import { ChatMessage } from "@/components/Chat";
import {
  capReachedAtom,
  proxyEmbeddingAtom,
  proxyLlmAtom,
  localOpenAiApiKeyAtom,
  userWorkspaceAtom,
} from "@/lib/store";
import { SupabaseBucketWorkspace } from "@/app/api/agent-jobs/SupabaseBucketWorkspace";

interface UseEvoArgs {
  onChatLog: (message: ChatMessage) => Promise<void>;
  onAgentMessages: (type: ChatLogType, messages: AgentMessage[]) => Promise<void>;
  onVariableSet: (key: string, value: string) => Promise<void>;
}

export function useEvo({
  onChatLog,
  onAgentMessages,
  onVariableSet
}: UseEvoArgs): {
  isRunning: boolean;
  error?: string;
  start: (message: string) => void;
  onContinue: () => void;
  onPause: () => void;
  isPaused: boolean;
  isStopped: boolean;
  isSending: boolean;
  setIsSending: (sending: boolean) => void;
} {
  // const supabase = useSupabase();
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const [iterator, setIterator] = useState<
    ReturnType<Evo["run"]> | undefined
  >();

  const [error, setError] = useState<string | undefined>();
  const [localOpenAiApiKey] = useAtom(localOpenAiApiKeyAtom);
  const [evo, setEvo] = useState<Evo | undefined>();
  const [, setLlmProxyApi] = useAtom(proxyLlmAtom);
  const [, setEmbeddingProxyApi] = useAtom(proxyEmbeddingAtom);

  const [, setCapReached] = useAtom(capReachedAtom);
  const [userWorkspace, setUserWorkspace] = useAtom(userWorkspaceAtom);

  useEffect(() => {
    (async () => {
      try {
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
          setLlmProxyApi(llm as ProxyLlmApi);
          embedding = new ProxyEmbeddingApi(cl100k_base, () =>
            setCapReached(true)
          );
          setEmbeddingProxyApi(embedding as ProxyEmbeddingApi);
        }

        let workspace = userWorkspace;

        if (!workspace) {
          workspace = new InMemoryWorkspace();
          // workspace = new SupabaseBucketWorkspace();
          setUserWorkspace(workspace);
        }

        const internals = new SubWorkspace(".evo", workspace);

        const chat = new EvoChat(cl100k_base, {
          onMessagesAdded: onAgentMessages,
        });
        const agentVariables = new AgentVariables({
          onVariableSet
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
    })();
  }, [
    localOpenAiApiKey
  ]);

  const start = (goal: string) => {
    if (!evo) return;
    setIterator(evo.run({ goal }));
    setIsRunning(true);
  };

  const onPause = () => {
    if (!isPaused) {
      setIsPaused(true);
    }
  };

  const onContinue = () => {
    if (isPaused) {
      setIsPaused(false);
    }
  };

  useEffect(() => {
    const runEvo = async () => {
      // Create a new iteration thread
      if (!iterator) return;
      let stepCounter = 1;
      while (isRunning) {
        setIsStopped(false);
        const response = await iterator.next();
        if (response.done) {
          console.log(response.value);
          const actionTitle = response.value.value.title;
          if (
            actionTitle.includes("onGoalAchieved") ||
            actionTitle === "SUCCESS"
          ) {
            await onChatLog({
              title: "## Goal Achieved",
              user: "evo",
            });
          }
          setIsRunning(false);
          setIterator(undefined);
          setIsSending(false);
          evo?.reset();
          break;
        }

        await onChatLog({
          title: `## Step ${stepCounter}`,
          user: "evo",
        });

        if (!response.done) {
          // TODO: Update this function to add information to the modal output (rather than adding it into the chat)
          const evoMessage = {
            title: `### Action executed:\n${response.value.title}`,
            content: response.value.content,
            user: "evo",
          };
          // messageLog = [...messageLog, evoMessage];
          await onChatLog(evoMessage);
        }

        stepCounter++;
      }
    };

    const timer = setTimeout(runEvo, 200);
    return () => clearTimeout(timer);
  }, [isRunning, iterator, isPaused]);

  return {
    isRunning,
    onPause,
    start,
    error,
    onContinue,
    isPaused,
    isSending,
    isStopped,
    setIsSending,
  };
}
