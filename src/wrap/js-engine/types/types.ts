// @ts-ignore
import * as Types from "./";

// @ts-ignore
import {
  CoreClient,
  InvokeResult,
  Uri,
} from "@polywrap/core-js";

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
export const JsEngine_Module = {
  eval: async (
    args: JsEngine_Module_Args_eval,
    client: CoreClient,
    uri: string = "ipfs/QmVhzZEswxuhNLxoREpemBGBpMKngMjyLFkdXRBTzP3grQ"
  ): Promise<InvokeResult<Types.JsEngine_EvalResult>> => {
    return client.invoke<Types.JsEngine_EvalResult>({
      uri: Uri.from(uri),
      method: "eval",
      args: (args as unknown) as Record<string, unknown>,
    });
  },

  evalWithGlobals: async (
    args: JsEngine_Module_Args_evalWithGlobals,
    client: CoreClient,
    uri: string = "ipfs/QmVhzZEswxuhNLxoREpemBGBpMKngMjyLFkdXRBTzP3grQ"
  ): Promise<InvokeResult<Types.JsEngine_EvalResult>> => {
    return client.invoke<Types.JsEngine_EvalResult>({
      uri: Uri.from(uri),
      method: "evalWithGlobals",
      args: (args as unknown) as Record<string, unknown>,
    });
  }
};

/// Imported Modules END ///
