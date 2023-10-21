import {
  AgentOutput,
  ChatMessage,
  ExecuteAgentFunctionCalled,
  RunResult,
  Timeout,
} from "@evo-ninja/agent-utils";
import { AgentContext } from "../../AgentContext";
import { prompts } from "./prompts";
import { Agent } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { ResultErr } from "@polywrap/result";
import { basicFunctionCallLoop } from "./basicFunctionCallLoop";

export class ChameleonAgent extends Agent {
  constructor(
    context: AgentContext,
    timeout?: Timeout,
  ) {
    super(
      new AgentConfig(
        prompts,
        [],
        context.scripts,
        timeout
      ),
      context,
    );
  }

  public override async* runWithChat(
    messages: ChatMessage[],
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    if (this.config.timeout) {
      setTimeout(
        this.config.timeout.callback,
        this.config.timeout.milliseconds
      );
    }
    try {
      const files = this.context.workspace.readdirSync("./");
      chat.persistent({
        role: "system",
        content: `Current directory: './'
Files: ${
  files.filter((x) => x.type === "file").map((x) => x.name).join(", ")
}\nDirectories: ${
  files.filter((x) => x.type === "directory").map((x) => x.name).join(", ")
}` 
      });
      chat.persistent({ role: "user", content: "If you can not achieve a goal, first try to exhaust different approaches before giving up." });

      for (const message of messages) {
        chat.persistent(message);
      }

      // Add functions to chat
      this.config.functions.forEach((fn) => {
        chat.addFunction(fn.getDefinition());
      });

      if (this.config.timeout) {
        setTimeout(this.config.timeout.callback, this.config.timeout.milliseconds);
      }

      return yield* basicFunctionCallLoop(
        this.context,
        this.config.functions.map((fn) => {
          return {
            definition: fn.getDefinition(),
            buildExecutor: (context: AgentContext) => {
              return fn.buildExecutor(this);
            }
          }
        }),
        (functionCalled: ExecuteAgentFunctionCalled) => {
          return this.config.shouldTerminate(functionCalled);
        },
        this.config.prompts.loopPreventionPrompt,
        this.config.prompts.agentSpeakPrompt
      );
    } catch (err) {
      this.context.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}
