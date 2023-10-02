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
  ) { }

  searchScripts(query: string): Script[] {
    const scripts = this.getAllScripts();

    const options = {
      keys: [
        "name",
        "description"
      ]
    };

    const fuse = new Fuse(Object.values(scripts), options);

    return fuse.search(query).map((r) => r.item);
  }

  getAllScripts(): Script[] {
    const ops: Script[] = [];
    this._workspace.readdirSync(this._toSubpath(""))
      .filter(file => path.extname(file) === ".json")
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
    return this.getAllScripts().find(
      (op) => op.name === name
    );
  }

  addScript(name: string, script: Script) {
    this._workspace.writeFileSync(
      this._toSubpath(`${name}.js`),
      script.code
    );
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
