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


import { InvokerOptions } from "@polywrap/client-js/build/types";
import { ResultErr, ResultOk } from "@polywrap/result";
import { Logger, Workspace } from "@evo-ninja/agent-utils";

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
      .setPackage("plugin/web", PluginPackage.from(module => ({
        "search": async (args: any) => {
          const apiKey = 'GOOGLE API KEY';
          const searchEngineId = 'Seach Engine';
          const query = args.query;
      
          const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${searchEngineId}`;
      
          try {
            const response = await axios.get(url);
            const data = response.data;
            
            return data.items.map((item: any) => ({
              title: item.title,
              link: item.link,
              snippet: item.snippet,
            }));
          } catch (error) {
            logger.error(`Error performing search: ${error}`);
            return [];
          }
        }
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
      })))
      .setPackage("plugin/datetime", PluginPackage.from(module => ({
        "now": async () => Date.now(),
        "parse": async (args: any) => Date.parse(args.date),
        "UTC": async (args: any) => Date.UTC(args.year, args.month, args.day, args.hour, args.minute, args.second, args.millisecond),
        "getDate": async (args: any) => new Date(args.timestamp).getDate(),
        "getDay": async (args: any) => new Date(args.timestamp).getDay(),
        "getFullYear": async (args: any) => new Date(args.timestamp).getFullYear(),
        "getHours": async (args: any) => new Date(args.timestamp).getHours(),
        "getMilliseconds": async (args: any) => new Date(args.timestamp).getMilliseconds(),
        "getMinutes": async (args: any) => new Date(args.timestamp).getMinutes(),
        "getMonth": async (args: any) => new Date(args.timestamp).getMonth(),
        "getSeconds": async (args: any) => new Date(args.timestamp).getSeconds(),
        "getTime": async (args: any) => new Date(args.timestamp).getTime(),
        "getTimezoneOffset": async (args: any) => new Date(args.timestamp).getTimezoneOffset(),
        "getUTCDate": async (args: any) => new Date(args.timestamp).getUTCDate(),
        "getUTCDay": async (args: any) => new Date(args.timestamp).getUTCDay(),
        "getUTCFullYear": async (args: any) => new Date(args.timestamp).getUTCFullYear(),
        "getUTCHours": async (args: any) => new Date(args.timestamp).getUTCHours(),
        "getUTCMilliseconds": async (args: any) => new Date(args.timestamp).getUTCMilliseconds(),
        "getUTCMinutes": async (args: any) => new Date(args.timestamp).getUTCMinutes(),
        "getUTCMonth": async (args: any) => new Date(args.timestamp).getUTCMonth(),
        "getUTCSeconds": async (args: any) => new Date(args.timestamp).getUTCSeconds(),
        "setDate": async (args: any) => new Date(args.timestamp).setDate(args.day),
        "setFullYear": async (args: any) => new Date(args.timestamp).setFullYear(args.year),
        "setHours": async (args: any) => new Date(args.timestamp).setHours(args.hour),
        "setMilliseconds": async (args: any) => new Date(args.timestamp).setMilliseconds(args.millisecond),
        "setMinutes": async (args: any) => new Date(args.timestamp).setMinutes(args.minute),
        "setMonth": async (args: any) => new Date(args.timestamp).setMonth(args.month),
        "setSeconds": async (args: any) => new Date(args.timestamp).setSeconds(args.second),
        "setTime": async (args: any) => new Date(args.timestamp).setTime(args.time),
        "setUTCDate": async (args: any) => new Date(args.timestamp).setUTCDate(args.day),
        "setUTCFullYear": async (args: any) => new Date(args.timestamp).setUTCFullYear(args.year),
        "setUTCHours": async (args: any) => new Date(args.timestamp).setUTCHours(args.hour),
        "setUTCMilliseconds": async (args: any) => new Date(args.timestamp).setUTCMilliseconds(args.millisecond),
        "setUTCMinutes": async (args: any) => new Date(args.timestamp).setUTCMinutes(args.minute),
        "setUTCMonth": async (args: any) => new Date(args.timestamp).setUTCMonth(args.month),
        "setUTCSeconds": async (args: any) => new Date(args.timestamp).setUTCSeconds(args.second),
        "toDateString": async (args: any) => new Date(args.timestamp).toDateString(),
        "toISOString": async (args: any) => new Date(args.timestamp).toISOString(),
        "toJSON": async (args: any) => new Date(args.timestamp).toJSON(),
        "toLocaleDateString": async (args: any) => new Date(args.timestamp).toLocaleDateString(),
        "toLocaleString": async (args: any) => new Date(args.timestamp).toLocaleString(),
        "toLocaleTimeString": async (args: any) => new Date(args.timestamp).toLocaleTimeString(),
        "toString": async (args: any) => new Date(args.timestamp).toString(),
        "toTimeString": async (args: any) => new Date(args.timestamp).toTimeString(),
        "toUTCString": async (args: any) => new Date(args.timestamp).toUTCString(),
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