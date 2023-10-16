import {
  Scripts,
  agentPlugin,
  WrapClient,
  AgentVariables
} from "@evo-ninja/agent-utils";
import { AgentBase, AgentBaseConfig, AgentBaseContext } from "../../AgentBase";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { CreateScriptFunction } from "../../functions/CreateScript";
import { ExecuteScriptFunction } from "../../functions/ExecuteScript";
import { FindScriptFunction } from "../../functions/FindScript";
import { ReadVariableFunction } from "../../functions/ReadVariable";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ScriptedAgentContext } from "../../scriptedAgents";
import * as prompts from "./prompts";

const AGENT_NAME = "Scripter";

export interface ScripterRunArgs {
  goal: string
}

export class Scripter extends AgentBase<ScripterRunArgs, ScriptedAgentContext> {
  constructor(
    context: AgentBaseContext,
    scripts: Scripts,
    variables: AgentVariables = new AgentVariables()
  ) {
    const agentContext: ScriptedAgentContext = {
      ...context,
      scripts,
      variables,
      client: new WrapClient(context.workspace, context.logger, agentPlugin({ logger: context.logger }), context.env),
    };

    const onGoalAchievedFn = new OnGoalAchievedFunction(agentContext.client, agentContext.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(agentContext.client, agentContext.scripts);

    const config: AgentBaseConfig<ScripterRunArgs> = {
      name: AGENT_NAME,
      expertise: prompts.EXPERTISE,
      initialMessages: prompts.INITIAL_MESSAGES,
      loopPreventionPrompt: prompts.LOOP_PREVENTION_PROMPT,
      functions: [
        new CreateScriptFunction(agentContext.scripts),
        new ExecuteScriptFunction(agentContext.client, agentContext.scripts),
        new FindScriptFunction(agentContext.scripts),
        new ReadVariableFunction(),
        new ReadFileFunction(agentContext.client, agentContext.scripts),
        new WriteFileFunction(agentContext.client, agentContext.scripts),
        new ReadDirectoryFunction(agentContext.client, agentContext.scripts),
        onGoalAchievedFn,
        onGoalFailedFn,
      ],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
          functionCalled.name
        );
      },
    };

    super(config, agentContext);
  }
}
