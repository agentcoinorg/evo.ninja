import {
  Args_ask,
  Args_speak,
  Module,
  manifest
} from "./types";
import { AGENT_PLUGIN_SPEAK_RESPONSE } from "../prompts";

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
    return AGENT_PLUGIN_SPEAK_RESPONSE;
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
