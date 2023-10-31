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

  searchAllScripts(query: string): Script[] {
    return Scripts.searchScripts(query, this.getAllScripts());
  }

  getAllScripts(): Script[] {
    const ops: Script[] = [];
    this._workspace
      .readdirSync(this._toSubpath(""))
      .filter(
        (file) => file.type === "file" && path.extname(file.name) === ".json"
      )
      .map((file) => file.name)
      .forEach((file) => {
        const script = JSON.parse(
          this._workspace.readFileSync(this._toSubpath(file))
        );

        // If "code" is a path
        if (script.code.startsWith("./")) {
          // Read it from disk
          script.code = this._workspace.readFileSync(
            this._toSubpath(script.code)
          );
        }

        ops.push(script);
      });

    return ops;
  }

  getScriptByName(name: string): Script | undefined {
    return this.getAllScripts().find((op) => op.name === name);
  }

  addScript(name: string, script: Script) {
    this._workspace.writeFileSync(this._toSubpath(`${name}.js`), script.code);
    script.code = `./${name}.js`;
    this._workspace.writeFileSync(
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
