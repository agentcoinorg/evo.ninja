
import { ResultErr, Result, ResultOk } from "@polywrap/result";
import {
  Agent,
  AgentFunctionResult,
  AgentOutput,
  Chat,
  ChatRole,
  ExecuteAgentFunctionCalled,
  JsEngine,
  JsEngine_GlobalVar,
  LlmApi,
  Logger,
  RunResult,
  Scripts,
  Workspace,
  WrapClient,
  basicFunctionCallLoop,
  shimCode
} from "@evo-ninja/agent-utils";
import { AgentFunction } from "./types";

interface SubAgentContext {
  llm: LlmApi;
  chat: Chat;
  workspace: Workspace;
  scripts: Scripts;
  client: WrapClient;
  logger: Logger;
}

interface SubAgentFunction extends AgentFunction {
  isTermination: boolean;
}

interface AgentFunctions extends Record<string, SubAgentFunction> {
  agent_onGoalAchieved: SubAgentFunction;
  agent_onGoalFailed: SubAgentFunction;
};

export interface SubAgentConfig {
  name: string;
  initialMessages: (agentName: string, runArguments: SubAgentRunArgs) => { role: ChatRole; content: string }[];
  loopPreventionPrompt: string;
  functions: AgentFunctions;
}

interface CreateScriptExecutorArgs<TAgentContext> {
  context: TAgentContext
  scriptName: string;
  onSuccess: (params: any) => AgentFunctionResult;
}

interface SubAgentRunArgs {
  goal: string;
}

export class SubAgent<TAgentContext extends SubAgentContext = SubAgentContext> implements Agent<SubAgentRunArgs> {
  constructor(
    private config: SubAgentConfig,
    private context: TAgentContext,
  ) {}

  public get workspace(): Workspace {
    return this.context.workspace;
  }

  public async* run(
    args: SubAgentRunArgs
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    try {
      this.config.initialMessages(this.config.name, args).forEach((message) => {
        chat.persistent(message.role, message.content);
      })

      const functionEntries = Object.entries(this.config.functions);
      const functions = functionEntries.map(([name, definition]) => ({
        definition: {
          ...definition,
          name
        },
        buildExecutor: (context: TAgentContext) => this.createScriptExecutor({
          context,
          scriptName: name.split("_").join("."),
          onSuccess: (params) => definition.success(this.config.name, name, params)
        })
      }))

      return yield* basicFunctionCallLoop(
        this.context,
        functions,
        (functionCalled: ExecuteAgentFunctionCalled) => {
          return this.config.functions[functionCalled.name].isTermination;
        },
        this.config.loopPreventionPrompt
      );
    } catch (err) {
      this.context.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }

  protected createScriptExecutor(args: CreateScriptExecutorArgs<TAgentContext>) {
    return async (params: any): Promise<Result<AgentFunctionResult, string>> => {
      const script = args.context.scripts.getScriptByName(args.scriptName);

      if (!script) {
        return ResultErr(`Unable to find the script ${name}`);
      }
  
      const globals: JsEngine_GlobalVar[] = Object.entries(params).map(
        (entry) => ({
          name: entry[0],
          value: JSON.stringify(entry[1])
        })
      );
      const jsEngine = new JsEngine(args.context.client);
      const result = await jsEngine.evalWithGlobals({
        src: shimCode(script.code),
        globals
      });
  
      if (!result.ok) {
        return ResultErr(result.error?.toString());
      }
  
      return ResultOk(args.onSuccess(params));
    };
  }
}
