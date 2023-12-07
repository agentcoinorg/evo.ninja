import { Workspace } from "../sys";

import Fuse from "fuse.js";
import path from "path-browserify";

export interface Script {
  name: string;
  description: string;
  arguments: string;
  code: string;
}

export class Scripts {
  constructor(
    private _workspace: Workspace,
    private _directory?: string
  ) {}

  static searchScripts(query: string, scripts: Script[]): Script[] {
    const fuse = new Fuse(scripts, {
      ignoreLocation: true,
      threshold: 0.4,
      isCaseSensitive: false,
      shouldSort: true,
      keys: ["name", "description"],
    });

    return Array.from(
      new Set(
        query
          .split(" ")
          .map((q) => fuse.search(q))
          .flat()
          .map((x) => x.item)
      )
    );
  }

  async searchAllScripts(query: string): Promise<Script[]> {
    return Scripts.searchScripts(query, await this.getAllScripts());
  }

  async getAllScripts(): Promise<Script[]> {
    const ops: Script[] = [];
    const items = await this._workspace.readdir(this._toSubpath(""));
    const files = items
      .filter(
        (file) => file.type === "file" && path.extname(file.name) === ".json"
      )
      .map((file) => file.name);

    for (const file of files) {
      const script = JSON.parse(
        await this._workspace.readFile(this._toSubpath(file))
      );

      // If "code" is a path
      if (script.code.startsWith("./")) {
        // Read it from disk
        script.code = await this._workspace.readFile(
          this._toSubpath(script.code)
        );
      }

      ops.push(script);
    }

    return ops;
  }

  async getScriptByName(name: string): Promise<Script | undefined> {
    return (await this.getAllScripts()).find((op) => op.name === name);
  }

  async addScript(name: string, script: Script): Promise<void> {
    await this._workspace.writeFile(this._toSubpath(`${name}.js`), script.code);
    script.code = `./${name}.js`;
    await this._workspace.writeFile(
      this._toSubpath(`${name}.json`),
      JSON.stringify(script, null, 2)
    );
  }

  private _toSubpath(subpath: string) {
    if (this._directory) {
      return path.join(this._directory, subpath);
    } else {
      return subpath;
    }
  }
}
