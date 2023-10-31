// @ts-ignore
import * as Types from "./";

// @ts-ignore
import { CoreClient, InvokeResult, Uri } from "@polywrap/core-js";
import { PolywrapClient } from "@polywrap/client-js";

export type UInt = number;
export type UInt8 = number;
export type UInt16 = number;
export type UInt32 = number;
export type Int = number;
export type Int8 = number;
export type Int16 = number;
export type Int32 = number;
export type Bytes = Uint8Array;
export type BigInt = string;
export type BigNumber = string;
export type Json = string;
export type String = string;
export type Boolean = boolean;

/// Imported Objects START ///

/* URI: "ipfs/QmVhzZEswxuhNLxoREpemBGBpMKngMjyLFkdXRBTzP3grQ" */
export interface JsEngine_EvalResult {
  value?: Types.Json | null;
  error?: Types.String | null;
}

/* URI: "ipfs/QmVhzZEswxuhNLxoREpemBGBpMKngMjyLFkdXRBTzP3grQ" */
export interface JsEngine_GlobalVar {
  name: Types.String;
  value: Types.Json;
}

/// Imported Objects END ///

/// Imported Modules START ///

/* URI: "ipfs/QmVhzZEswxuhNLxoREpemBGBpMKngMjyLFkdXRBTzP3grQ" */
export interface JsEngine_Module_Args_eval {
  src: Types.String;
}

/* URI: "ipfs/QmVhzZEswxuhNLxoREpemBGBpMKngMjyLFkdXRBTzP3grQ" */
export interface JsEngine_Module_Args_evalWithGlobals {
  src: Types.String;
  globals: Array<Types.JsEngine_GlobalVar>;
}

/* URI: "ipfs/QmVhzZEswxuhNLxoREpemBGBpMKngMjyLFkdXRBTzP3grQ" */
export class JsEngine {
  protected _defaultClient: CoreClient;
  protected _defaultUri: string;
  protected _defaultEnv?: Record<string, unknown>;

  constructor(
    client?: CoreClient,
    env?: Record<string, unknown>,
    uri?: string
  ) {
    this._defaultClient = this._getClient(client);
    this._defaultEnv = this._getEnv(env);
    this._defaultUri = this._getUri(uri);
  }

  public get client(): CoreClient {
    return this._defaultClient;
  }

  public get uri(): string {
    return this._defaultUri;
  }

  public get env(): Record<string, unknown> | undefined {
    return this._defaultEnv;
  }

  private _getClient(client?: CoreClient): CoreClient {
    return client || this._defaultClient || this._getDefaultClient();
  }

  private _getUri(uri?: string): string {
    return uri || this._defaultUri || this._getDefaultUri();
  }

  private _getEnv(
    env?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    return env || this._defaultEnv || this._getDefaultEnv();
  }

  protected _getDefaultClient(): CoreClient {
    return new PolywrapClient();
  }
  protected _getDefaultUri(): string {
    return "ipfs/QmVhzZEswxuhNLxoREpemBGBpMKngMjyLFkdXRBTzP3grQ";
  }
  protected _getDefaultEnv(): Record<string, unknown> | undefined {
    return undefined;
  }

  async eval(
    args: JsEngine_Module_Args_eval,
    client?: CoreClient,
    env?: Record<string, unknown>,
    uri?: string
  ): Promise<InvokeResult<Types.JsEngine_EvalResult>> {
    const _client = this._getClient(client);
    const _env = this._getEnv(env);
    const _uri = this._getUri(uri);

    return _client.invoke<Types.JsEngine_EvalResult>({
      uri: Uri.from(_uri),
      method: "eval",
      args: args as unknown as Record<string, unknown>,
      env: _env,
    });
  }

  async evalWithGlobals(
    args: JsEngine_Module_Args_evalWithGlobals,
    client?: CoreClient,
    env?: Record<string, unknown>,
    uri?: string
  ): Promise<InvokeResult<Types.JsEngine_EvalResult>> {
    const _client = this._getClient(client);
    const _env = this._getEnv(env);
    const _uri = this._getUri(uri);

    return _client.invoke<Types.JsEngine_EvalResult>({
      uri: Uri.from(_uri),
      method: "evalWithGlobals",
      args: args as unknown as Record<string, unknown>,
      env: _env,
    });
  }
}

/// Imported Modules END ///
