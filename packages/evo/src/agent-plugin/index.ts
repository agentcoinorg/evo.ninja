import {
  Args_ask,
  Args_speak,
  Module,
  manifest
} from "./types";

import { Logger } from "@evo-ninja/agent-utils";
import { PluginFactory, PluginPackage } from "@polywrap/plugin-js";

export interface AgentPluginConfig {
  logger: Logger;
}

export class AgentPlugin extends Module<AgentPluginConfig> {
  private _logger: Logger;

  constructor(config: AgentPluginConfig) {
    super(config);
    this._logger = this.config.logger;
  }

  public speak(args: Args_speak): string {
    this._logger.success(args.message);
    return "User has been informed! If you think you've achieved the goal, execute onGoalAchieved.\nIf you think you've failed, execute onGoalFailed.";
  }

  public async ask(args: Args_ask): Promise<string> {
    const response = await this._logger.prompt(args.message);
    return "User: " + response;
  }

  public onGoalAchieved(): boolean {
    this._logger.success("Goal has been achieved!");
    return true;
  }

  public onGoalFailed(): boolean {
    this._logger.error("Goal could not be achieved!");
    return true;
  }
}

export const agentPlugin: PluginFactory<AgentPluginConfig> = (
  config: AgentPluginConfig
) => {
  return new PluginPackage(
    new AgentPlugin(config),
    manifest
  );
};
