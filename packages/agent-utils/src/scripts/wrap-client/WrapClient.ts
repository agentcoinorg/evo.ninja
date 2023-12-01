import { jsEnginePackage } from "./js-engine-wrap/wrap";
import { Env, Logger, Workspace } from "../../";

import {
  PolywrapClient,
  PolywrapClientConfigBuilder,
  IWrapPackage,
  Result
} from "@polywrap/client-js";
import { PluginPackage } from "@polywrap/plugin-js";
import { ResultErr, ResultOk } from "@polywrap/result";
import * as  path from "path-browserify"
import axios from "axios";

export class WrapClient extends PolywrapClient {

  public jsPromiseOutput: Result<any, any>

  constructor(
    workspace: Workspace,
    logger: Logger,
    agentPlugin?: IWrapPackage,
    env?: Env
  ) {
    const builder = new PolywrapClientConfigBuilder()
      .addBundle("web3")
      .addBundle("sys")
      .setPackage("ipfs/QmVhzZEswxuhNLxoREpemBGBpMKngMjyLFkdXRBTzP3grQ", jsEnginePackage)
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
          return workspace.readFile(args.path);
        },
        "writeFileSync": async (args: any) => {
          await workspace.writeFile(args.path, args.data.toString());
          return true;
        },
        "appendFileSync": async (args: any) => {
          await workspace.appendFile(args.path, args.data.toString());
          return true;
        },
        "existsSync": async (args: any) => {
          return workspace.exists(args.path);
        },
        "renameSync": async (args: any) => {
          return workspace.rename(args.oldPath, args.newPath);
        },
        "mkdirSync": async (args: any) => {
          workspace.mkdir(args.path);
          return true;
        },
        "readdirSync": async (args: any) => {
          return workspace.readdir(args.path);
        }
      })))
      .setPackage("plugin/axios", PluginPackage.from(module => ({
        "get": async (args: any) => {
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
            res = {
              error: JSON.stringify(e)
            };
          }
  
          return res;
        },
        "post": async (args: any) => {
          return await axios.post(args.url, args.data, args.config);
        },
        "put": async (args: any) => {
          return await axios.put(args.url, args.data, args.config);
        },
        "delete": async (args: any) => {
          return await axios.delete(args.url, args.config);
        },
        "head": async (args: any) => {
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
      })))
      .setPackage("plugin/path", PluginPackage.from(module => ({
        "resolve": (args: any) => {
          return path.resolve("/", args.pathSegments)
        },
        "normalize": (args: any) => path.normalize(args.path),
        "isAbsolute": (args: any) => path.isAbsolute(args.path),
        "join": (args: any) => path.join(args.paths),
        "relative": (args: any) => path.relative(args.from, args.to),
        "dirname": (args: any) => path.dirname(args.path),
        "basename": (args: any) => path.basename(args.path, args.ext),
        "extname": (args: any) => path.extname(args.path),
        "format": (args: any) => path.format(args.pathObject),
        "parse": (args: any) => path.parse(args.path)
      })))
      .setPackage("plugin/websearch", PluginPackage.from(module => ({
        "search": async (args: { query: string }) => {
          try {
            const axiosClient = axios.create({
              baseURL: "https://serpapi.com",
            });

            const apiKey = env?.SERP_API_KEY;
            if (!apiKey) {
              throw new Error(
                "SERP_API_KEY environment variable is required to use the websearch plugin. See env.template for help"
              );
            }

            const searchQuery = encodeURI(args.query);
            const urlParams = new URLSearchParams({
              engine: "google",
              q: searchQuery,
              location_requested: "United States",
              location_used: "United States",
              google_domain: "google.com",
              hl: "en",
              gl: "us",
              device: "desktop",
              api_key: apiKey,
            });

            const { data } = await axiosClient.get<{
              organic_results: {
                title: string;
                link: string;
                snippet: string;
                snippet_highlighted_words: string[];
              }[];
            }>(`/search?${urlParams.toString()}`, {
              headers: {
                Accept: "application/json",
              },
            });

            let result: {
              title: string;
              url: string;
              description: string;
            }[] = [];

            if (data && Array.isArray(data.organic_results)) {
              result = data.organic_results
                .map((result) => ({
                  title: result.title ?? "",
                  url: result.link ?? "",
                  description: result.snippet ?? "",
                }))
                .slice(0, 4);
            }

            return JSON.stringify(result);
          } catch (e: any) {
            console.log(e)
            throw new Error("Error in search: " + e.message.toString());
          }
        }
      })))

    if (agentPlugin) {
      builder
        .setPackage("plugin/agent", agentPlugin);
    }

    super(builder.build());
  }
}