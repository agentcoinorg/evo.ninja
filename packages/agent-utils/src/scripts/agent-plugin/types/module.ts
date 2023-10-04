/// NOTE: This is an auto-generated file.
///       All modifications will be overwritten.

// @ts-ignore
import * as Types from "./types";

// @ts-ignore
import { CoreClient, MaybeAsync } from "@polywrap/core-js";
import { PluginModule } from "@polywrap/plugin-js";

export interface Args_speak {
  message: Types.String;
}

export interface Args_ask {
  message: Types.String;
}

export interface Args_onGoalAchieved {
}

export interface Args_onGoalFailed {
}

export abstract class Module<TConfig> extends PluginModule<TConfig> {
  abstract speak(
    args: Args_speak,
    client: CoreClient,
    env?: null
  ): MaybeAsync<Types.String>;

  abstract ask(
    args: Args_ask,
    client: CoreClient,
    env?: null
  ): MaybeAsync<Types.String>;

  abstract onGoalAchieved(
    args: Args_onGoalAchieved,
    client: CoreClient,
    env?: null
  ): MaybeAsync<Types.Boolean>;

  abstract onGoalFailed(
    args: Args_onGoalFailed,
    client: CoreClient,
    env?: null
  ): MaybeAsync<Types.Boolean>;
}
