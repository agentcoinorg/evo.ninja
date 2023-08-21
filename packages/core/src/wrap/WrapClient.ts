import {
  PolywrapClient,
  PolywrapClientConfigBuilder,
  Uri,
  InvokeResult
} from "@polywrap/client-js";
import { PluginPackage } from "@polywrap/plugin-js";
import axios from "axios";

import { Workspace, Logger } from "..";
import { InvokerOptions } from "@polywrap/client-js/build/types";

export class WrapClient extends PolywrapClient {

  public jsPromiseOutput: { result: any };

  constructor(
    workspace: Workspace,
    logger: Logger
  ) {
    const jsPromiseOutput = { result: undefined };

    const builder = new PolywrapClientConfigBuilder()
      .addBundle("web3")
      .addBundle("sys")
      .setPackage("plugin/result", PluginPackage.from(module => ({
        "post": async (args: any) => {
          jsPromiseOutput.result = args.result;
        },
      })))

      .setPackage("plugin/console", PluginPackage.from(module => ({
        "log": async (args: any) => {
          logger.info("CONSOLE.LOG " + JSON.parse(args.message));
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
      })))
      .setPackage("plugin/agent", PluginPackage.from(module => ({
        "onGoalAchieved": async (args: any) => {
          logger.success("Goal has been achieved!");
          process.exit(0);
        },
        "speak": async (args: any) => {
          logger.success("Agent: " + args.message);
          return "User has been informed! If you think you've achieved the goal, execute onGoalAchieved.";
        },
        "ask": async (args: any) => {
          logger.error("Agent: " + args.message);
          const response = await prompt("");
          return "User: " + response;
        },
      })));

    super(builder.build());

    this.jsPromiseOutput = jsPromiseOutput;
  }

  async invoke<TData = unknown, TUri extends Uri | string = string>(options: InvokerOptions<TUri>): Promise<InvokeResult<TData>> {
    return await super.invoke(options);
  }
}