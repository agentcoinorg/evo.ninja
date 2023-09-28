import { agentFunctions } from "./agent-functions";
import { agentPlugin } from "./agent-plugin";
import { AgentContext } from "./AgentContext";
import { Scripts } from "./Scripts";
import { WrapClient } from "./wrap";
import {
  INITIAL_PROMP,
  LOOP_PREVENTION_PROMPT
} from "./prompts";

import {
  Agent,
  Workspace,
  LlmApi,
  Chat,
  Logger,
  AgentOutput,
  RunResult,
  Timeout,
  InMemoryWorkspace,
  executeAgentFunction,
  basicFunctionCallLoop
} from "@evo-ninja/agent-utils";
import { ScriptWriter } from "@evo-ninja/js-script-writer-agent";
import { ResultErr } from "@polywrap/result";

export class Evo implements Agent {
  private readonly context: AgentContext;

  constructor(
    private readonly llm: LlmApi,
    private readonly chat: Chat,
    private readonly logger: Logger,
    private readonly workspace: Workspace,
    scripts: Scripts,
    private readonly timeout?: Timeout
  ) {
    this.context = {
      llm,
      chat,
      workspace,
      scripts,
      logger,
      globals: {},
      client: new WrapClient(
        this.workspace,
        this.logger,
        agentPlugin({ logger: this.logger })
      ),
    };
  }

  public async* run(goal: string): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    const createScriptWriter = (): ScriptWriter => {
      const workspace = new InMemoryWorkspace();
      const chat = new Chat(this.llm, this.chat.tokenizer, this.logger);
      return new ScriptWriter(this.llm, chat, this.logger, workspace);
    };

    if (this.timeout) {
      setTimeout(this.timeout.callback, this.timeout.milliseconds);
    }

    try {
      chat.persistent("system", INITIAL_PROMP);
      chat.persistent("user", goal);

      const functionCallLoop: AsyncGenerator<AgentOutput, RunResult, string | undefined> = basicFunctionCallLoop(
        this.context,
        executeAgentFunction,
        agentFunctions(createScriptWriter),
        (functionCalled) => {
          const namespace = functionCalled.args.namespace || "";
          const terminationFunctions = [
            `agent.onGoalAchieved`,
            `agent.onGoalFailed`
          ];
          return terminationFunctions.includes(namespace);
        },
        LOOP_PREVENTION_PROMPT
      );

      // Allow additional actions to be performed on each value
      let next = await functionCallLoop.next();
      while (!next.done) {
        yield next.value;
        next = await functionCallLoop.next();
        await this.condenseFindScriptMessages();
      }
      return next.value;
    } catch (err) {
      this.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }

  private async condenseFindScriptMessages(): Promise<void> {
    let msgs = this.chat.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
      const currentMsg = msgs[i];

      // we can use fnNamespace in the executeScript message to identify its associated findScript results message
      let fnNamespace: string | undefined = undefined;
      if (currentMsg.role === "assistant" && currentMsg.function_call?.name === "executeScript") {
        const args = currentMsg.function_call.arguments;
        fnNamespace = JSON.parse(args ?? "{}").namespace;
      }

      if (fnNamespace) {
        for (let j = i - 1; j >= 0; j--) {
          const foundScriptMsg = msgs[j];
          // stop searching if we find a system message that indicates we have already modified the log
          if (
            foundScriptMsg.role === "system" &&
            foundScriptMsg.content?.startsWith("Found the following script\n")
          ) {
            break;
          }

          if (
            foundScriptMsg.role === "system" &&
            foundScriptMsg.content?.startsWith("Found the following results for script") &&
            foundScriptMsg.content?.includes(`Namespace: ${fnNamespace}`)
          ) {
            // condense findScript results message
            const nsIndex = foundScriptMsg.content.indexOf(`Namespace: ${fnNamespace}`);
            const scriptEndIndex = foundScriptMsg.content.indexOf("\n--------------", nsIndex);
            const newContent = "Found the following script\n" + foundScriptMsg.content.slice(nsIndex, scriptEndIndex) + "\n\`\`\`";
            this.chat.replaceMessageContentAtIndex(j, newContent);

            // remove findScript function call message (currently always precedes findScript results message)
            const prevMsgIndex = j - 1;
            const findScriptMsg = msgs[prevMsgIndex];
            if (findScriptMsg.role === "assistant" && findScriptMsg.function_call?.name === "findScript") {
              this.chat.removeMessageAtIndex(prevMsgIndex);
              msgs = this.chat.messages;
            }
            break;
          }
        }
        break;
      }
    }
    this.logger.notice("Internally condensed findScript messages. This won't be reflected in the logs");
  }
}