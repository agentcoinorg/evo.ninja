import { ConsoleLogger, Evo, Logger, Scripts } from "@evo-ninja/agents";
import { useState } from "react";
import { BrowserLogger } from "../sys/logger";
import { createInBrowserScripts } from "../scripts";
import { useDojo } from "./useDojo";

interface State {
    evo: Evo
    iterator: ReturnType<Evo["run"]>
    running: boolean
}

export function useEvo() {
  const { config, error } = useDojo();
  const [evo, setEvo] = useState<Evo | undefined>();

  const createEvo = (browserLogger: BrowserLogger) => {
    try {
      //   const browserLogger = new BrowserLogger({
      //     onLog: (message: string) => {
      //       // onMessage({
      //       //   user: "evo",
      //       //   title: message,
      //       // });
      //     },
      //   });
      const logger = new Logger([browserLogger, new ConsoleLogger()], {
        promptUser: () => Promise.resolve("N/A"),
      });

      const scriptsWorkspace = createInBrowserScripts();
      const scripts = new Scripts(scriptsWorkspace);

      // Point by default to GPTx-4 unless the given api key's account doesn't support it
      // let model = "gpt-4"
      // if (dojoConfig.openAiApiKey) {
      //   try {
      //     model = await checkLlmModel(dojoConfig.openAiApiKey as string, model);
      //   } catch (e: any) {
      //     if (e.message.includes("Incorrect API key provided")) {
      //       setDojoError("Open AI API key is not correct. Please make sure it has the correct format")
      //       return
      //     }
      //   }
      // }

      // const env = new Env({
      //   OPENAI_API_KEY: dojoConfig.openAiApiKey || " ",
      //   GPT_MODEL: model,
      //   CONTEXT_WINDOW_TOKENS: "8000",
      //   MAX_RESPONSE_TOKENS: "2000",
      // });

      // let llm: LlmApi;
      // let embedding: EmbeddingApi;

      // if (dojoConfig.openAiApiKey) {
      //   llm = new OpenAILlmApi(
      //     env.OPENAI_API_KEY,
      //     env.GPT_MODEL as LlmModel,
      //     env.CONTEXT_WINDOW_TOKENS,
      //     env.MAX_RESPONSE_TOKENS,
      //     logger
      //   );
      //   embedding = new OpenAIEmbeddingAPI(env.OPENAI_API_KEY, logger, cl100k_base)
      // } else {
      //   llm = new ProxyLlmApi(
      //     env.GPT_MODEL as LlmModel,
      //     env.CONTEXT_WINDOW_TOKENS,
      //     env.MAX_RESPONSE_TOKENS,
      //     () => setCapReached(true)
      //   );
      //   setProxyLlmApi(llm as ProxyLlmApi);
      //   embedding = new ProxyEmbeddingApi(cl100k_base, () => setCapReached(true));
      //   setProxyEmbeddingApi(embedding as ProxyEmbeddingApi);
      // }

      // let workspace = userWorkspace;

      // if (!workspace) {
      //   workspace = new InMemoryWorkspace();
      //   setUserWorkspace(workspace);
      // }

      // const internals = new SubWorkspace(".evo", workspace);

      // const chat = new EvoChat(cl100k_base);
      // setEvo(
      //   new Evo(
      //     new AgentContext(
      //       llm,
      //       embedding,
      //       chat,
      //       logger,
      //       workspace,
      //       internals,
      //       env,
      //       scripts
      //     )
      //   )
      // );
    } catch (e) {}
  };
  return [evo, setEvo];
}
