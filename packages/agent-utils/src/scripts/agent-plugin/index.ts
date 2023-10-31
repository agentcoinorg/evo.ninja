import {
  Args_ask,
  Args_onGoalAchieved,
  Args_onGoalFailed,
  Args_speak,
  Module,
  manifest,
} from "./types";
import { AGENT_SPEAK_RESPONSE, Logger } from "../../";

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
    return AGENT_SPEAK_RESPONSE;
  }

  public async ask(args: Args_ask): Promise<string> {
    const response = await this._logger.prompt(args.message);
    return "User: " + response;
  }

  public onGoalAchieved(args: Args_onGoalAchieved): boolean {
    this._logger.success(`Goal has been achieved: ${args.message}`);
    return true;
  }

  public onGoalFailed(args: Args_onGoalFailed): boolean {
    this._logger.error(`Goal could not be achieved: ${args.message}`);
    return true;
  }
}

export const agentPlugin: PluginFactory<AgentPluginConfig> = (
  config: AgentPluginConfig
) => {
  return new PluginPackage(new AgentPlugin(config), manifest);
};
