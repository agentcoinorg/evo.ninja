import {
  PolywrapClient,
  PolywrapClientConfigBuilder,
  Uri,
  InvokeResult
} from "@polywrap/client-js";
import { PluginPackage } from "@polywrap/plugin-js";
import fs from "fs";
import axios from "axios";

import readline from "readline";
import chalk from "chalk";
import { Workspace } from "..";
import { InvokerOptions } from "@polywrap/client-js/build/types";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

export class WrapClient extends PolywrapClient {

  public jsPromiseOutput: { result: any };

  constructor(workspace: Workspace) {
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
          console.log("CONSOLE.LOG", JSON.parse(args.message));
        },
      })))
      .setPackage("plugin/fs", PluginPackage.from(module => ({
        "readFileSync": async (args: any) => {
          console.log(chalk.yellow("FS.READ = " + args.path));
          return workspace.readFileSync(args.path);
        },
        "writeFileSync": async (args: any) => {
          console.log(chalk.yellow("FS.WRITE = " + args.path));
          workspace.writeFileSync(args.path, args.data.toString());
          return true;
        },
        "appendFileSync": async (args: any) => {
          console.log(chalk.yellow("FS.APPEND = " + args.path));
          fs.appendFileSync(args.path, args.data.toString());
          workspace.appendFileSync(args.path, args.data.toString());
          return true;
        },
        "existsSync": async (args: any) => {
          console.log(chalk.yellow("FS.EXISTS = " + args.path));
          return workspace.existsSync(args.path);
        },
        "renameSync": async (args: any) => {
          console.log(chalk.yellow("FS.RENAME FROM = " + args.oldPath + " TO = " + args.newPath));
          return workspace.renameSync(args.oldPath, args.newPath);
        },
        "mkdirSync": async (args: any) => {
          console.log(chalk.yellow("FS.MKDIR = " + args.path));
          workspace.mkdirSync(args.path);
          return true;
        },
        "readdirSync": async (args: any) => {
          console.log(chalk.yellow("FS.READDIR = " + args.path));
          return workspace.readdirSync(args.path);
        }
      })))
      .setPackage("plugin/axios", PluginPackage.from(module => ({
        "get": async (args: any) => {
          console.log(chalk.yellow(`AXIOS.GET = ${args.url}`));
          let res;
          try {
            const result = await axios.get(args.url, args.config);
            res = {
              status: result.status,
              statusText: result.statusText,
              headers: result.headers,
              data: result.data
            };
            console.log(res);
          } catch (e) {
            console.error(e);
            res = {
              error: e
            };
          }
  
          return res;
        },
        "post": async (args: any) => {
            console.log(chalk.yellow(`AXIOS.POST = ${args.url}`));
            return await axios.post(args.url, args.data, args.config);
        },
        "put": async (args: any) => {
            console.log(chalk.yellow(`AXIOS.PUT = ${args.url}`));
            return await axios.put(args.url, args.data, args.config);
        },
        "delete": async (args: any) => {
            console.log(chalk.yellow(`AXIOS.DELETE = ${args.url}`));
            return await axios.delete(args.url, args.config);
        },
        "head": async (args: any) => {
            console.log(chalk.yellow(`AXIOS.HEAD = ${args.url}`));
            return await axios.head(args.url, args.config);
        },
      })))
      .setPackage("plugin/agent", PluginPackage.from(module => ({
        "onGoalAchieved": async (args: any) => {
          console.log(chalk.green("Goal has been achieved!"));
          process.exit(0);
        },
        "speak": async (args: any) => {
          console.log(chalk.green("Agent: " + args.message));
          return "User has been informed! If you think you've achieved the goal, execute onGoalAchieved.";
        },
        "ask": async (args: any) => {
          console.log(chalk.red("Agent: " + args.message));
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