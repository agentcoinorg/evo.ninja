import {
  LlmApi,
  Chat,
  Workspace,
  Scripts,
  Env,
  agentPlugin,
  WrapClient,
  Logger,
  AgentVariables
} from "@evo-ninja/agent-utils";
import { AgentBase, AgentBaseConfig } from "../../AgentBase";
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

export interface ScripterRunArgs {
  goal: string
}

export class Scripter extends AgentBase<ScripterRunArgs, ScriptedAgentContext> {
  constructor(
    llm: LlmApi,
    chat: Chat,
    logger: Logger,
    workspace: Workspace,
    scripts: Scripts,
    env: Env,
    variables: AgentVariables = new AgentVariables()
  ) {
    const agentContext: ScriptedAgentContext = {
      llm,
      chat,
      workspace,
      scripts,
      logger,
      variables,
      client: new WrapClient(workspace, logger, agentPlugin({ logger }), env),
      env,
    };

    const AGENT_NAME = "Scripter";

    const onGoalAchievedFn = new OnGoalAchievedFunction(agentContext.client, agentContext.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(agentContext.client, agentContext.scripts);

    const config: AgentBaseConfig<ScripterRunArgs> = {
      name: AGENT_NAME,
      expertise: "executing and creating scripts to solve basic tasks",
      initialMessages: ({ goal }) => [
        {
          role: "user",
          content: `Purpose:
You are an expert assistant designed to achieve goals through the use of scripts. You prioritize the use of existing scripts, and only create new scripts as a last-resort.

Functionalities:
findScript: Search and identify scripts that can be repurposed or combined for the current task.
executeScript: Run scripts using TypeScript syntax. Double-check the script's output to ensure it's correct.
readVariable: Access the JSON preview of a variable. You use this to read through partial outputs of scripts, if they are too large, to find the desired information.
createScript: You ONLY resort to creating a specific script when you are certain that no existing script can be modified or combined to solve the problem. You never create overly general or vague scripts.

Decision-making Process:
You first evaluate the goal and see if it can be achieved without using scripts.
Then you use findScript to search for any script that fits the task. It's vital to exhaust all possibilities here.
When suitable scripts are found, you run them to solve the problem.
If no scripts have been found, you cautiously consider createScript. You ensure any new script you create is specific, actionable, and not general.
If a goal has been achieved or failed, you will call the agent_onGoalAchieved or agent_onGoalFailed function.`,
        },
        {
          role: "user",
          content: goal,
        },
      ],
      loopPreventionPrompt:
        "Assistant, you seem to be looping. Try calling findScript, or exiting by calling agent_onGoalAchieved or agent_onGoalFailed.",
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
