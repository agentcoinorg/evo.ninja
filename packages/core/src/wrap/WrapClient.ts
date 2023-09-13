import {
  PolywrapClient,
  PolywrapClientConfigBuilder,
  Uri,
  InvokeResult,
  IWrapPackage,
  Result
} from "@polywrap/client-js";
import { PluginPackage } from "@polywrap/plugin-js";
import axios from "axios";

import { Workspace, Logger } from "..";
import { InvokerOptions } from "@polywrap/client-js/build/types";
import { ResultErr, ResultOk } from "@polywrap/result";

export class WrapClient extends PolywrapClient {

  public jsPromiseOutput: Result<any, any>

  constructor(
    workspace: Workspace,
    logger: Logger,
    agentPlugin: IWrapPackage | undefined = undefined,
  ) {
    const builder = new PolywrapClientConfigBuilder()
      .addBundle("web3")
      .addBundle("sys")
      .setPackage("plugin/math", PluginPackage.from(module => ({
        "random": async () => {
          return Math.random();
        },
      })))
      .setPackage("plugin/result", PluginPackage.from(module => ({
        "ok": async (args: any) => {
          this.jsPromiseOutput = ResultOk(args.value);
        },
        "err": async (args: any) => {
          this.jsPromiseOutput = ResultErr(args.error);
        },
      })))
      .setPackage("plugin/console", PluginPackage.from(module => ({
        "log": async (args: any) => {
          logger.info("CONSOLE.LOG " + JSON.stringify(args.args, null, 2));
        },
        "error": async (args: any) => {
          logger.error("CONSOLE.ERROR " + JSON.stringify(args.args, null, 2));
          this.jsPromiseOutput = ResultErr(args.args)
        },
      })))
      .setPackage("plugin/fs", PluginPackage.from(module => ({
        "readFileSync": async (args: any) => {
          logger.notice("FS.READ = " + args.path);
          return workspace.readFileSync(args.path);
        },
        "writeFileSync": async (args: any) => {
          logger.notice("FS.WRITE = " + args.path);
          workspace.writeFileSync(args.path, args.data.toString());
          return true;
        },
        "appendFileSync": async (args: any) => {
          logger.notice("FS.APPEND = " + args.path);
          workspace.appendFileSync(args.path, args.data.toString());
          return true;
        },
        "existsSync": async (args: any) => {
          logger.notice("FS.EXISTS = " + args.path);
          return workspace.existsSync(args.path);
        },
        "renameSync": async (args: any) => {
          logger.notice("FS.RENAME FROM = " + args.oldPath + " TO = " + args.newPath);
          return workspace.renameSync(args.oldPath, args.newPath);
        },
        "mkdirSync": async (args: any) => {
          logger.notice("FS.MKDIR = " + args.path);
          workspace.mkdirSync(args.path);
          return true;
        },
        "readdirSync": async (args: any) => {
          logger.notice("FS.READDIR = " + args.path);
          return workspace.readdirSync(args.path);
        }
      })))
      .setPackage("plugin/axios", PluginPackage.from(module => ({
        "get": async (args: any) => {
          logger.notice(`AXIOS.GET = ${args.url}`);
          let res;
          try {
            const result = await axios.get(args.url, args.config);
            res = {
              status: result.status,
              statusText: result.statusText,
              headers: result.headers,
              data: result.data
            };
          } catch (e) {
            logger.error(e);
            res = {
              error: JSON.stringify(e)
            };
          }
  
          return res;
        },
        "post": async (args: any) => {
          logger.notice(`AXIOS.POST = ${args.url}`);
          return await axios.post(args.url, args.data, args.config);
        },
        "put": async (args: any) => {
          logger.notice(`AXIOS.PUT = ${args.url}`);
          return await axios.put(args.url, args.data, args.config);
        },
        "delete": async (args: any) => {
          logger.notice(`AXIOS.DELETE = ${args.url}`);
          return await axios.delete(args.url, args.config);
        },
        "head": async (args: any) => {
          logger.notice(`AXIOS.HEAD = ${args.url}`);
          return await axios.head(args.url, args.config);
        },
      })));

    if (agentPlugin) {
      builder
        .setPackage("plugin/agent", agentPlugin);
    }

    super(builder.build());
  }

  async invoke<TData = unknown, TUri extends Uri | string = string>(options: InvokerOptions<TUri>): Promise<InvokeResult<TData>> {
    return await super.invoke(options);
  }
}