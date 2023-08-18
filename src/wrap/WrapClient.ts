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
          console.log("resssssult", args);
          jsPromiseOutput.result = args.result;
        },
      })))
      .setPackage("plugin/fs", PluginPackage.from(module => ({
        "readFileSync": async (args: any) => {
          console.log(chalk.yellow("FS.READ = " + args.path));
          return fs.readFileSync(args.path, "utf8");
        },
        "writeFileSync": async (args: any) => {
          console.log(chalk.yellow("FS.WRITE = " + args.path));
          fs.writeFileSync(args.path, args.data.toString());
          return true;
        },
        "appendFileSync": async (args: any) => {
          console.log(chalk.yellow("FS.APPEND = " + args.path));
          fs.appendFileSync(args.path, args.data.toString());
          return true;
        },
        "existsSync": async (args: any) => {
          console.log(chalk.yellow("FS.EXISTS = " + args.path));
          return fs.existsSync(args.path);
        },
        "unlinkSync": async (args: any) => {
          console.log(chalk.yellow("FS.REMOVE = " + args.path));
          fs.unlinkSync(args.path);
          return true;
        },
        "renameSync": async (args: any) => {
          console.log(chalk.yellow("FS.RENAME FROM = " + args.oldPath + " TO = " + args.newPath));
          fs.renameSync(args.oldPath, args.newPath);
          return true;
        },
        "mkdirSync": async (args: any) => {
          console.log(chalk.yellow("FS.MKDIR = " + args.path));
          fs.mkdirSync(args.path, { recursive: true });
          return true;
        },
        "readdirSync": async (args: any) => {
          console.log(chalk.yellow("FS.READDIR = " + args.path));
          return fs.readdirSync(args.path);
        }
      })))
      .setPackage("plugin/axios", PluginPackage.from(module => ({
        "get": async (args: any) => {
          console.log(chalk.yellow(`AXIOS.GET = ${args.url}`));
          const result = await axios.get(args.url, args.config);
          const res = {
            status: result.status,
            statusText: result.statusText,
            headers: result.headers,
            data: result.data
          };
          console.log(res);
  
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