
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

interface SubAgentContext {
  llm: LlmApi;
  chat: Chat;
  workspace: Workspace;
  scripts: Scripts;
  client: WrapClient;
}

interface AgentFunction {
  success: (agentName: string, functionName: string, params: Record<string, any>) => AgentFunctionResult;
  description: string;
  parameters: Record<string, any>;
  isTermination: boolean;
}

interface AgentFunctions extends Record<string, AgentFunction> {
  agent_onGoalAchieved: AgentFunction;
  agent_onGoalFailed: AgentFunction;
};

export interface AgentConfig<TRunArgs> {
  name: string;
  initialMessages: (agentName: string, runArguments: TRunArgs) => { role: ChatRole; content: string }[];
  loopPreventionPrompt: string;
  functions: AgentFunctions;
}

interface CreateScriptExecutorArgs<TAgentContext> {
  context: TAgentContext
  scriptName: string;
  onSuccess: (params: any) => AgentFunctionResult;
}

export class SubAgent<TRunArgs, TAgentContext extends SubAgentContext = SubAgentContext> implements Agent<TRunArgs> {
  constructor(
    private config: AgentConfig<TRunArgs>,
    private context: TAgentContext,
    private logger: Logger,
  ) {}

  public get workspace(): Workspace {
    return this.context.workspace;
  }

  public async* run(
    args: TRunArgs
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
      this.logger.error(err);
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
