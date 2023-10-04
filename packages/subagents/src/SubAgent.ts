
import { ResultErr, Result, ResultOk } from "@polywrap/result";
import {
  Agent,
  AgentFunctionResult,
  AgentOutput,
  Chat,
  Env,
  ExecuteAgentFunctionCalled,
  JsEngine,
  JsEngine_GlobalVar,
  LlmApi,
  Logger,
  RunResult,
  Scripts,
  Workspace,
  WrapClient,
  agentPlugin,
  basicFunctionCallLoop,
  shimCode
} from "@evo-ninja/agent-utils";

interface AgentContext {
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
}

export interface AgentConfig {
  name: string;
  prompts: {
    initialPrompt: (name: string) => string;
    goalPrompt: (goal: string) => string;
    loopPreventionPrompt: () => string;
  },
  functions: AgentFunctions;
}

interface CreateScriptExecutorArgs {
  scripts: Scripts;
  scriptName: string;
  client: WrapClient;
  onSuccess: (params: any) => AgentFunctionResult;
}

export class SubAgent implements Agent {
  private readonly context: AgentContext;

  constructor(
    private config: AgentConfig,
    llm: LlmApi,
    chat: Chat,
    workspace: Workspace,
    scripts: Scripts,
    private logger: Logger,
    private readonly env: Env,
  ) {
    this.context = {
      llm: llm,
      chat: chat,
      scripts: scripts,
      workspace: workspace,
      client: new WrapClient(
        workspace,
        logger,
        agentPlugin({ logger: logger }),
        this.env
      ),
    };
  }

  public get workspace(): Workspace {
    return this.context.workspace;
  }

  public async* run(
    goal: string
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    try {
      chat.persistent("system", this.config.prompts.initialPrompt(this.config.name));
      chat.persistent("user", this.config.prompts.goalPrompt(goal));

      const functionEntries = Object.entries(this.config.functions);
      const functions = functionEntries.map(([name, definition]) => ({
        definition: {
          ...definition,
          name
        },
        buildExecutor: (context: AgentContext) => this.createScriptExecutor({
          client: context.client,
          scripts: context.scripts,
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
        this.config.prompts.loopPreventionPrompt()
      );
    } catch (err) {
      this.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }

  private createScriptExecutor(args: CreateScriptExecutorArgs) {
    return async (params: any): Promise<Result<AgentFunctionResult, string>> => {
      const script = args.scripts.getScriptByName(args.scriptName);

      if (!script) {
        return ResultErr(`Unable to find the script ${name}`);
      }
  
      const globals: JsEngine_GlobalVar[] = Object.entries(params).map(
        (entry) => ({
          name: entry[0],
          value: JSON.stringify(entry[1])
        })
      );
      const jsEngine = new JsEngine(args.client);
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
