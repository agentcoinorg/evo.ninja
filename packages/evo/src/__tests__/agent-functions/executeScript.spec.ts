import {
  Chat,
  ChatMessage,
  InMemoryWorkspace,
  LlmApi,
  LlmOptions,
  LlmRoles,
  Logger,
  OpenAIFunctions,
} from "@evo-ninja/agent-utils";
import { AgentContext } from "../../AgentContext";
import { executeScript } from "../../agent-functions/executeScript";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import { WrapClient } from "../../wrap";
import { ConsoleLogger } from "@evo-ninja/agent-utils";
import { Scripts } from "../../Scripts";

class MockLlm implements LlmApi {
  getMaxContextTokens(): number {
    return 10_000_000_000;
  }
  getModel(): string {
    return "mock";
  }
  getResponse(
    chat: Chat,
    functionDefinitions: OpenAIFunctions | undefined,
    options?: LlmOptions | undefined
  ): Promise<ChatMessage | undefined> {
    const message: ChatMessage = {
      role: LlmRoles.Assistant,
      function_call: {
        name: "executeScript",
        arguments:
          "{\n" +
          '  "namespace": "fs_writeFile",\n' +
          '  "arguments": {\n' +
          '    "path": "hey.txt",\n' +
          '    "data": "hey"\n' +
          "  },\n" +
          `  "description": "Write 'hey' to a file named 'hey.txt'"\n` +
          "}",
      },
    };
    return Promise.resolve(message);
  }
}

// class MockScripts {}

describe("Evo Execute script", () => {
  test("Should execute given script", async () => {
    const llm = new MockLlm();
    const workspace = new InMemoryWorkspace();
    const consoleLogger = new ConsoleLogger();
    const logger = new Logger([consoleLogger], {
      promptUser: async () => "",
      logUserPrompt: (response: string) => {
        consoleLogger.info(`#User:\n${response}`);
      },
    });
    const chat = new Chat(llm, cl100k_base, logger);
    const client = new WrapClient(workspace, logger);

    const context: AgentContext = {
      llm,
      workspace,
      client,
      chat,
      globals: {},
      scripts: new Scripts(workspace),
      logger: logger,
    };
    const executor = executeScript.buildExecutor(context);
    const response = await executor({
      namespace: "",
    });
    console.log(response);
  });
});
